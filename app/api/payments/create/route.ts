import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import Booking from "@/models/Booking";
import Payment from "@/models/Payment";
import { requireAuth } from "@/lib/rbac";
import { isValidObjectId } from "@/lib/mongo";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { isSameOrigin } from "@/lib/security";
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
} from "@/lib/api-response";

/**
 * Temporary local payment endpoint.
 *
 * Real PayMongo integration is intentionally not wired here yet. This route
 * is gated behind ENABLE_LOCAL_PAYMENT=1 and is meant strictly for dev work.
 * It will return 503 in any environment that does not opt in, so a misconfigured
 * production deploy cannot mark bookings PAID without a real payment.
 *
 * When PayMongo is wired up:
 *   - replace this body with a paymongo.createPaymentIntent call
 *   - return { clientKey } so the client can confirm with Card / GCash / PayMaya
 *   - keep the booking in CONFIRMED until the webhook flips it to PAID
 */
export async function POST(req: NextRequest) {
  try {
    if (!isSameOrigin(req)) return forbiddenResponse();

    if (process.env.ENABLE_LOCAL_PAYMENT !== "1") {
      return errorResponse(
        "Online payments are temporarily unavailable. Please contact us to complete your booking.",
        503
      );
    }

    const user = await requireAuth();
    if (!user) return unauthorizedResponse();
    const ip = getClientIp(req);
    const limited = await rateLimit(`payment:${ip}:${user.id}`, 20, 15 * 60 * 1000);
    if (!limited.allowed) return errorResponse("Too many payment attempts. Please try again later.", 429);

    const body = (await req.json()) as { bookingId?: unknown };
    const bookingId = body?.bookingId;
    if (typeof bookingId !== "string") return errorResponse("Booking ID is required");
    if (!isValidObjectId(bookingId)) return notFoundResponse("Booking");

    await connectDB();

    const booking = await Booking.findById(bookingId);
    if (!booking) return notFoundResponse("Booking");

    if (booking.customerId.toString() !== user.id) return forbiddenResponse();

    if (booking.status === "PAID" || booking.status === "COMPLETED") {
      return successResponse({
        bookingId: booking._id.toString(),
        paymentId: booking.paymentId?.toString(),
        status: booking.status,
        amount: booking.totalAmount,
        mode: "local",
      });
    }

    if (booking.status !== "CONFIRMED") {
      return errorResponse("Only confirmed bookings can be paid");
    }

    let payment = await Payment.findOne({ bookingId });
    if (!payment) {
      payment = await Payment.create({
        bookingId,
        customerId: user.id,
        amount: booking.totalAmount,
        currency: "php",
        status: "SUCCEEDED",
        metadata: { mode: "local" },
      });
    } else {
      payment.status = "SUCCEEDED";
      payment.amount = booking.totalAmount;
      payment.currency = "php";
      payment.metadata = { mode: "local" };
      await payment.save();
    }

    // CAS: only update if still CONFIRMED.
    const updated = await Booking.findOneAndUpdate(
      { _id: bookingId, status: "CONFIRMED" },
      { $set: { status: "PAID", paymentId: payment._id, paidAt: new Date() } },
      { new: true }
    );

    if (!updated) {
      return errorResponse("Booking is no longer payable. Refresh and try again.", 409);
    }

    return successResponse({
      bookingId: updated._id.toString(),
      paymentId: payment._id.toString(),
      status: updated.status,
      amount: payment.amount,
      mode: "local",
    });
  } catch (err) {
    console.error("[PAYMENT_CREATE]", err);
    return errorResponse("Internal server error", 500);
  }
}
