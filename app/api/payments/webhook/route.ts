import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import Payment from "@/models/Payment";
import Booking from "@/models/Booking";
import User from "@/models/User";
import { sendBookingConfirmation } from "@/services/email";
import { formatCurrency, formatDate } from "@/lib/utils";
import { successResponse, errorResponse } from "@/lib/api-response";

const WEBHOOK_SECRET = process.env.PAYMONGO_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get("paymongo-signature");

    if (WEBHOOK_SECRET && signature) {
      const crypto = await import("crypto");
      const expectedSignature = crypto
        .createHmac("sha256", WEBHOOK_SECRET)
        .update(body)
        .digest("hex");

      if (signature !== expectedSignature) {
        return errorResponse("Invalid signature", 401);
      }
    }

    const event = JSON.parse(body);
    const { type, data } = event.data.attributes;

    if (type === "payment.paid") {
      const paymentIntentId = data.attributes.payment_intent_id;

      await connectDB();

      const payment = await Payment.findOne({ paymongoPaymentIntentId: paymentIntentId });
      if (!payment) return successResponse({ received: true });

      payment.status = "SUCCEEDED";
      await payment.save();

      const booking = await Booking.findById(payment.bookingId).populate("packageId", "name");
      if (booking) {
        booking.status = "PAID";
        await booking.save();

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
    }

    if (type === "payment.failed") {
      const paymentIntentId = data.attributes.payment_intent_id;
      await connectDB();
      const payment = await Payment.findOne({ paymongoPaymentIntentId: paymentIntentId });
      if (payment) {
        payment.status = "FAILED";
        await payment.save();
      }
    }

    return successResponse({ received: true });
  } catch (err) {
    console.error("[WEBHOOK]", err);
    return errorResponse("Webhook error", 400);
  }
}
