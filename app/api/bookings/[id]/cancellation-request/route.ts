import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import Booking from "@/models/Booking";
import CancellationRequest from "@/models/CancellationRequest";
import { requireAuth } from "@/lib/rbac";
import { isValidObjectId } from "@/lib/mongo";
import { isSameOrigin } from "@/lib/security";
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse, notFoundResponse } from "@/lib/api-response";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!isSameOrigin(req)) return forbiddenResponse();
    const user = await requireAuth();
    if (!user) return unauthorizedResponse();
    if (user.role !== "CUSTOMER") return forbiddenResponse();

    const { id } = await params;
    if (!isValidObjectId(id)) return notFoundResponse("Booking");
    const { reason } = await req.json() as { reason?: string };
    const trimmedReason = reason?.trim();

    if (!trimmedReason || trimmedReason.length < 10) {
      return errorResponse("Please provide a reason with at least 10 characters");
    }

    await connectDB();

    const booking = await Booking.findById(id);
    if (!booking) return notFoundResponse("Booking");

    if (booking.customerId.toString() !== user.id) return forbiddenResponse();
    if (booking.status !== "PAID") {
      return errorResponse("Cancellation requests are only available for paid bookings");
    }

    const existing = await CancellationRequest.findOne({
      bookingId: id,
      customerId: user.id,
      status: "OPEN",
    });

    if (existing) {
      existing.reason = trimmedReason;
      await existing.save();
      return successResponse({ ...existing.toObject(), _id: existing._id.toString() });
    }

    const request = await CancellationRequest.create({
      bookingId: id,
      customerId: user.id,
      reason: trimmedReason,
      status: "OPEN",
    });

    return successResponse({ ...request.toObject(), _id: request._id.toString() }, 201);
  } catch (err) {
    console.error("[CANCELLATION_REQUEST_POST]", err);
    return errorResponse("Internal server error", 500);
  }
}
