import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import Booking from "@/models/Booking";
import Payment from "@/models/Payment";
import User from "@/models/User";
import { requireAuth } from "@/lib/rbac";
import { isValidObjectId } from "@/lib/mongo";
import { isSameOrigin } from "@/lib/security";
import { sendBookingConfirmation } from "@/services/email";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
} from "@/lib/api-response";

/**
 * Demo-only fast-path: flip a CONFIRMED booking to PAID without going
 * through PayMongo. Useful for portfolio walk-throughs where the
 * reviewer doesn't have a GCash/Maya wallet to scan a real QRPh code.
 *
 * Hard-gated behind ENABLE_LOCAL_PAYMENT=1. Returns 503 in any other
 * environment so a misconfigured production deploy can never bypass
 * payment. The real PayMongo flow (/api/payments/create + webhook) is
 * always available regardless of this flag.
 */
export async function POST(req: NextRequest) {
  try {
    if (process.env.ENABLE_LOCAL_PAYMENT !== "1") {
      return errorResponse("Demo payment is not enabled", 503);
    }
    if (!isSameOrigin(req)) return forbiddenResponse();

    const user = await requireAuth();
    if (!user) return unauthorizedResponse();

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

    // Persist the demo Payment row (or upgrade an existing PENDING one
    // from a previous PayMongo attempt).
    let payment = await Payment.findOne({ bookingId });
    if (!payment) {
      payment = await Payment.create({
        bookingId,
        customerId: user.id,
        amount: booking.totalAmount,
        currency: "php",
        status: "SUCCEEDED",
        metadata: { mode: "demo" },
      });
    } else {
      payment.status = "SUCCEEDED";
      payment.amount = booking.totalAmount;
      payment.metadata = { mode: "demo" };
      await payment.save();
    }

    // Compare-and-swap: only flip if still CONFIRMED. Prevents racing
    // with a real PayMongo webhook that could be in flight.
    const updated = await Booking.findOneAndUpdate(
      { _id: bookingId, status: "CONFIRMED" },
      { $set: { status: "PAID", paymentId: payment._id, paidAt: new Date() } },
      { new: true }
    );
    if (!updated) {
      return errorResponse("Booking is no longer payable. Refresh and try again.", 409);
    }

    // Fire-and-forget email — don't block the response on SMTP.
    const customer = (await User.findById(user.id).lean()) as
      | { name?: string; email?: string }
      | null;
    const pkg = updated.packageId as unknown as { name?: string };
    sendBookingConfirmation({
      customerName: customer?.name || "Customer",
      customerEmail: customer?.email || "",
      packageName: pkg?.name || "Package",
      eventDate: formatDate(updated.eventDate),
      venue: updated.venue,
      guestCount: updated.guestCount,
      totalAmount: formatCurrency(updated.totalAmount),
      bookingId: updated._id.toString(),
      status: "PAID",
    }).catch((err) => console.error("[DEMO_CONFIRM email]", err));

    return successResponse({
      bookingId: updated._id.toString(),
      paymentId: payment._id.toString(),
      status: "PAID",
      mode: "demo",
    });
  } catch (err) {
    console.error("[DEMO_CONFIRM]", err);
    return errorResponse("Internal server error", 500);
  }
}
