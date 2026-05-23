import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import Booking from "@/models/Booking";
import Payment from "@/models/Payment";
import User from "@/models/User";
import { requireAuth } from "@/lib/rbac";
import { isValidObjectId } from "@/lib/mongo";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { isSameOrigin } from "@/lib/security";
import { createCheckoutSession } from "@/services/paymongo";
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
} from "@/lib/api-response";

/**
 * Create a PayMongo Checkout Session and return its hosted URL.
 *
 * Flow:
 *   1. Customer clicks Pay on a CONFIRMED booking
 *   2. We create a Checkout Session, persist a PENDING Payment row tied
 *      to the PaymentIntent ID, return the checkout URL
 *   3. Client navigates to PayMongo's hosted page
 *   4. PayMongo emits `payment.paid` to our webhook on success
 *   5. The webhook flips the booking to PAID — NOT this route
 *
 * The booking status is intentionally not changed here. If the customer
 * abandons checkout the booking stays CONFIRMED and they can retry.
 * Trusting the success_url redirect to flip status would let anyone with
 * the URL forge a paid booking.
 */
export async function POST(req: NextRequest) {
  try {
    if (!isSameOrigin(req)) return forbiddenResponse();

    const user = await requireAuth();
    if (!user) return unauthorizedResponse();

    const ip = getClientIp(req);
    const limited = await rateLimit(`payment:${ip}:${user.id}`, 20, 15 * 60 * 1000);
    if (!limited.allowed) {
      return errorResponse("Too many payment attempts. Please try again later.", 429);
    }

    const body = (await req.json()) as { bookingId?: unknown };
    const bookingId = body?.bookingId;
    if (typeof bookingId !== "string") return errorResponse("Booking ID is required");
    if (!isValidObjectId(bookingId)) return notFoundResponse("Booking");

    await connectDB();

    const booking = await Booking.findById(bookingId).populate("packageId", "name");
    if (!booking) return notFoundResponse("Booking");
    if (booking.customerId.toString() !== user.id) return forbiddenResponse();

    if (booking.status === "PAID" || booking.status === "COMPLETED") {
      return errorResponse("This booking is already paid", 409);
    }
    if (booking.status !== "CONFIRMED") {
      return errorResponse("Only confirmed bookings can be paid");
    }

    const customer = (await User.findById(user.id).lean()) as
      | { name?: string; email?: string; phone?: string }
      | null;
    const pkg = booking.packageId as unknown as { name?: string };
    const origin = new URL(req.url).origin;

    const session = await createCheckoutSession({
      amount: Math.round(booking.totalAmount * 100), // PHP -> centavos
      description: `Booking #${booking._id.toString().slice(-8).toUpperCase()} — ${pkg?.name ?? "Package"}`,
      successUrl: `${origin}/bookings/${booking._id.toString()}?payment=success`,
      cancelUrl: `${origin}/bookings/${booking._id.toString()}?payment=cancelled`,
      metadata: { bookingId: booking._id.toString() },
      billing: {
        name: customer?.name,
        email: customer?.email,
        phone: customer?.phone,
      },
      lineItem: { name: pkg?.name ?? "Catering package", quantity: 1 },
    });

    const paymentIntentId = session.attributes.payment_intent?.id;

    // Persist (or update) the Payment row so the webhook can correlate
    // the incoming `payment.paid` event back to a booking via the
    // PaymentIntent id. Reusing an existing PENDING row prevents
    // duplicate inserts when the customer clicks Pay multiple times.
    let payment = await Payment.findOne({ bookingId });
    if (!payment) {
      payment = await Payment.create({
        bookingId,
        customerId: user.id,
        amount: booking.totalAmount,
        currency: "php",
        status: "PENDING",
        paymongoPaymentIntentId: paymentIntentId,
        metadata: { checkoutSessionId: session.id },
      });
    } else {
      payment.paymongoPaymentIntentId = paymentIntentId;
      payment.status = "PENDING";
      payment.amount = booking.totalAmount;
      payment.metadata = { checkoutSessionId: session.id };
      await payment.save();
    }

    return successResponse({
      checkoutUrl: session.attributes.checkout_url,
      sessionId: session.id,
    });
  } catch (err) {
    console.error("[PAYMENT_CREATE]", err);
    return errorResponse("Internal server error", 500);
  }
}
