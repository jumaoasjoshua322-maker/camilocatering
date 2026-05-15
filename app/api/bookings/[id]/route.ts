import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import Booking from "@/models/Booking";
import User from "@/models/User";
import { requireAuth } from "@/lib/rbac";
import { sendBookingConfirmation } from "@/services/email";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  successResponse, errorResponse, unauthorizedResponse,
  forbiddenResponse, notFoundResponse,
} from "@/lib/api-response";
import type { BookingStatus } from "@/types";

const TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  PENDING:   ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PAID", "CANCELLED"],
  PAID:      ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await requireAuth();
    if (!user) return unauthorizedResponse();

    await connectDB();
    const booking = await Booking.findById(id)
      .populate("packageId", "name category price inclusions")
      .populate("customerId", "name email phone")
      .lean();

    if (!booking) return notFoundResponse("Booking");

    const isOwner = (booking.customerId as { _id: { toString(): string } })?._id.toString() === user.id;
    if (!isOwner && user.role !== "ADMIN" && user.role !== "STAFF") {
      return forbiddenResponse();
    }

    return successResponse({ ...booking, _id: booking._id.toString() });
  } catch (err) {
    console.error("[BOOKING_GET]", err);
    return errorResponse("Internal server error", 500);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await requireAuth();
    if (!user) return unauthorizedResponse();

    const { status } = await req.json() as { status: BookingStatus };
    if (!status) return errorResponse("Status is required");

    await connectDB();
    const booking = await Booking.findById(id).populate("packageId", "name").populate("customerId", "name email");
    if (!booking) return notFoundResponse("Booking");

    const isStaffUser = user.role === "ADMIN" || user.role === "STAFF";
    const customerId = (booking.customerId as { _id?: { toString(): string }; toString(): string });
    const ownerId = customerId._id?.toString() ?? customerId.toString();
    const isOwner = ownerId === user.id;
    const customerCanCancel =
      isOwner &&
      user.role === "CUSTOMER" &&
      status === "CANCELLED" &&
      ["PENDING", "CONFIRMED"].includes(booking.status);

    if (!isStaffUser && !customerCanCancel) return forbiddenResponse();

    const allowed = TRANSITIONS[booking.status as BookingStatus];
    if (!allowed.includes(status)) {
      return errorResponse(`Cannot transition from ${booking.status} to ${status}`);
    }

    booking.status = status;
    await booking.save();

    const customer = await User.findById(booking.customerId).lean();
    const pkg = booking.packageId as unknown as { name: string };

    sendBookingConfirmation({
      customerName: (customer as { name: string })?.name || "Customer",
      customerEmail: (customer as { email: string })?.email || "",
      vendorName: "Camilo Catering",
      packageName: pkg?.name || "Package",
      eventDate: formatDate(booking.eventDate),
      venue: booking.venue,
      guestCount: booking.guestCount,
      totalAmount: formatCurrency(booking.totalAmount),
      bookingId: booking._id.toString(),
      status,
    }).catch(console.error);

    return successResponse({ ...booking.toObject(), _id: booking._id.toString() });
  } catch (err) {
    console.error("[BOOKING_PATCH]", err);
    return errorResponse("Internal server error", 500);
  }
}
