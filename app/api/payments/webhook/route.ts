import { NextRequest } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { connectDB } from "@/lib/db";
import Payment from "@/models/Payment";
import Booking from "@/models/Booking";
import User from "@/models/User";
import WebhookEvent from "@/models/WebhookEvent";
import { sendBookingConfirmation } from "@/services/email";
import { formatCurrency, formatDate } from "@/lib/utils";
import { successResponse, errorResponse } from "@/lib/api-response";

export const runtime = "nodejs";

const WEBHOOK_SECRET = process.env.PAYMONGO_WEBHOOK_SECRET;
const MAX_SIGNATURE_AGE_MS = 5 * 60 * 1000;
const EVENT_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;

interface ParsedSignature {
  timestamp: string;
  test?: string;
  live?: string;
}

/**
 * PayMongo signs webhooks with a header like:
 *   t=1700000000,te=abcdef...,li=abcdef...
 *
 * `te` is the test-mode signature, `li` is the live-mode signature.
 * Signature payload is `${t}.${rawBody}` HMAC-SHA256 with the webhook secret.
 *
 * @see https://developers.paymongo.com/docs/webhooks
 */
function parseSignatureHeader(header: string | null): ParsedSignature | null {
  if (!header) return null;
  const parts = header.split(",").map((p) => p.trim());
  const out: Partial<ParsedSignature> = {};
  for (const p of parts) {
    const [k, v] = p.split("=");
    if (!k || !v) continue;
    if (k === "t") out.timestamp = v;
    else if (k === "te") out.test = v;
    else if (k === "li") out.live = v;
  }
  if (!out.timestamp || (!out.test && !out.live)) return null;
  return out as ParsedSignature;
}

function safeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex"));
  } catch {
    return false;
  }
}

function verify(rawBody: string, header: string | null, secret: string): boolean {
  const parsed = parseSignatureHeader(header);
  if (!parsed) return false;

  const ts = parseInt(parsed.timestamp, 10);
  if (!Number.isFinite(ts)) return false;

  // Reject stale signatures to limit replay windows.
  const ageMs = Math.abs(Date.now() - ts * 1000);
  if (ageMs > MAX_SIGNATURE_AGE_MS) return false;

  const expected = createHmac("sha256", secret)
    .update(`${parsed.timestamp}.${rawBody}`)
    .digest("hex");

  return (
    (parsed.live ? safeEqualHex(expected, parsed.live) : false) ||
    (parsed.test ? safeEqualHex(expected, parsed.test) : false)
  );
}

export async function POST(req: NextRequest) {
  try {
    if (!WEBHOOK_SECRET) {
      console.error("[WEBHOOK] PAYMONGO_WEBHOOK_SECRET not configured");
      return errorResponse("Webhook not configured", 503);
    }

    const rawBody = await req.text();
    const sigHeader = req.headers.get("paymongo-signature");
    if (!verify(rawBody, sigHeader, WEBHOOK_SECRET)) {
      return errorResponse("Invalid signature", 401);
    }

    let event: {
      data?: { id?: string; attributes?: { type?: string; data?: { attributes?: { payment_intent_id?: string } } } };
    };
    try {
      event = JSON.parse(rawBody);
    } catch {
      return errorResponse("Invalid JSON", 400);
    }

    const eventId = event?.data?.id;
    const type = event?.data?.attributes?.type;
    const paymentIntentId = event?.data?.attributes?.data?.attributes?.payment_intent_id;

    if (!eventId || !type) return errorResponse("Malformed event", 400);

    await connectDB();

    // Idempotency: drop duplicates silently with 200 so PayMongo stops retrying.
    try {
      await WebhookEvent.create({
        source: "paymongo",
        eventId,
        type,
        expiresAt: new Date(Date.now() + EVENT_RETENTION_MS),
      });
    } catch (err: unknown) {
      const code = (err as { code?: number })?.code;
      if (code === 11000) return successResponse({ deduped: true });
      throw err;
    }

    if (!paymentIntentId) return successResponse({ received: true });

    if (type === "payment.paid") {
      const payment = await Payment.findOne({ paymongoPaymentIntentId: paymentIntentId });
      if (!payment) return successResponse({ received: true });

      payment.status = "SUCCEEDED";
      await payment.save();

      // CAS: only flip the booking if it is still CONFIRMED to avoid double-paying.
      const booking = await Booking.findOneAndUpdate(
        { _id: payment.bookingId, status: "CONFIRMED" },
        { $set: { status: "PAID", paymentId: payment._id, paidAt: new Date() } },
        { new: true }
      ).populate("packageId", "name");

      if (booking) {
        const customer = await User.findById(booking.customerId).lean();
        const pkg = booking.packageId as unknown as { name: string };

        sendBookingConfirmation({
          customerName: (customer as { name: string })?.name || "Customer",
          customerEmail: (customer as { email: string })?.email || "",
          vendorName: "Camilo's Catering",
          packageName: pkg?.name || "Package",
          eventDate: formatDate(booking.eventDate),
          venue: booking.venue,
          guestCount: booking.guestCount,
          totalAmount: formatCurrency(booking.totalAmount),
          bookingId: booking._id.toString(),
          status: "PAID",
        }).catch(console.error);
      }
    } else if (type === "payment.failed") {
      const payment = await Payment.findOne({ paymongoPaymentIntentId: paymentIntentId });
      if (payment) {
        payment.status = "FAILED";
        await payment.save();
      }
    }

    return successResponse({ received: true });
  } catch (err) {
    console.error("[WEBHOOK]", err);
    return errorResponse("Webhook error", 500);
  }
}
