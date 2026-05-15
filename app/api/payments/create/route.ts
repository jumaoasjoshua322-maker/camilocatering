import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import Booking from "@/models/Booking";
import Payment from "@/models/Payment";
import { requireAuth } from "@/lib/rbac";
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    if (!user) return unauthorizedResponse();

    const { bookingId } = await req.json();
    if (!bookingId) return errorResponse("Booking ID is required");

    await connectDB();

    const booking = await Booking.findById(bookingId);
    if (!booking) return notFoundResponse("Booking");

    if (booking.customerId.toString() !== user.id) {
      return errorResponse("Unauthorized", 403);
    }

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
        metadata: {
          mode: "local",
          note: "Temporary local payment. Replace with PayMongo later.",
        },
      });
    } else {
      payment.status = "SUCCEEDED";
      payment.amount = booking.totalAmount;
      payment.currency = "php";
      payment.metadata = {
        mode: "local",
        note: "Temporary local payment. Replace with PayMongo later.",
      };
      await payment.save();
    }

    booking.paymentId = payment._id;
    booking.status = "PAID";
    await booking.save();

    return successResponse({
      bookingId: booking._id.toString(),
      paymentId: payment._id.toString(),
      status: booking.status,
      amount: payment.amount,
      mode: "local",
    });
  } catch (err) {
    console.error("[PAYMENT_CREATE]", err);
    return errorResponse(err instanceof Error ? err.message : "Internal server error", 500);
  }
}
