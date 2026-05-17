import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import Booking from "@/models/Booking";
import User from "@/models/User";
import { requireAuth } from "@/lib/rbac";
import { sendBookingConfirmation } from "@/services/email";
import { formatCurrency, formatDate } from "@/lib/utils";
import { isValidObjectId } from "@/lib/mongo";
import { isSameOrigin } from "@/lib/security";
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

const ALL_STATUSES = new Set<BookingStatus>([
  "PENDING", "CONFIRMED", "PAID", "COMPLETED", "CANCELLED",
]);

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!isValidObjectId(id)) return notFoundResponse("Booking");
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
    if (!isSameOrigin(req)) return forbiddenResponse();
    const { id } = await params;
    if (!isValidObjectId(id)) return notFoundResponse("Booking");
    const user = await requireAuth();
    if (!user) return unauthorizedResponse();

    const body = (await req.json()) as { status?: unknown };
    const status = body?.status;
    if (typeof status !== "string" || !ALL_STATUSES.has(status as BookingStatus)) {
      return errorResponse("Invalid booking status");
    }
    const nextStatus = status as BookingStatus;

    await connectDB();
    // Read first only to check ownership and authorize the transition.
    const current = await Booking.findById(id).select("status customerId").lean();
    if (!current) return notFoundResponse("Booking");

    const ownerId =
      (current.customerId as { _id?: { toString(): string }; toString(): string })?._id?.toString() ??
      current.customerId.toString();
    const isStaffUser = user.role === "ADMIN" || user.role === "STAFF";
    const isOwner = ownerId === user.id;
    const customerCanCancel =
      isOwner &&
      user.role === "CUSTOMER" &&
      nextStatus === "CANCELLED" &&
      ["PENDING", "CONFIRMED"].includes(current.status as BookingStatus);

    if (!isStaffUser && !customerCanCancel) return forbiddenResponse();

    const allowedNext = TRANSITIONS[current.status as BookingStatus];
    if (!allowedNext.includes(nextStatus)) {
      return errorResponse(`Cannot transition from ${current.status} to ${nextStatus}`);
    }

    // Compare-and-swap: only update if status is still what we read.
    const update: Record<string, unknown> = { status: nextStatus };
    if (nextStatus === "PAID" && current.status !== "PAID") {
      update.paidAt = new Date();
    }
    const updated = await Booking.findOneAndUpdate(
      { _id: id, status: current.status },
      { $set: update },
      { new: true }
    )
      .populate("packageId", "name")
      .populate("customerId", "name email");

    if (!updated) {
      // Someone else moved the booking between our read and write.
      return errorResponse(
        "Booking was just updated by someone else. Refresh and try again.",
        409
      );
    }

    const customer = await User.findById(updated.customerId).lean();
    const pkg = updated.packageId as unknown as { name: string };

    sendBookingConfirmation({
      customerName: (customer as { name: string })?.name || "Customer",
      customerEmail: (customer as { email: string })?.email || "",
      packageName: pkg?.name || "Package",
      eventDate: formatDate(updated.eventDate),
      venue: updated.venue,
      guestCount: updated.guestCount,
      totalAmount: formatCurrency(updated.totalAmount),
      bookingId: updated._id.toString(),
      status: nextStatus,
    }).catch(console.error);

    return successResponse({ ...updated.toObject(), _id: updated._id.toString() });
  } catch (err) {
    console.error("[BOOKING_PATCH]", err);
    return errorResponse("Internal server error", 500);
  }
}
