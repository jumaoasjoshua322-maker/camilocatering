import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import Package from "@/models/Package";
import Booking from "@/models/Booking";
import { requireRole } from "@/lib/rbac";
import { packageSchema } from "@/lib/validations";
import { isValidObjectId } from "@/lib/mongo";
import {
  successResponse, errorResponse, unauthorizedResponse, notFoundResponse,
} from "@/lib/api-response";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!isValidObjectId(id)) return notFoundResponse("Package");
    await connectDB();
    const pkg = await Package.findById(id).lean();
    if (!pkg) return notFoundResponse("Package");
    return successResponse({ ...pkg, _id: pkg._id.toString() });
  } catch (err) {
    console.error("[PACKAGE_GET]", err);
    return errorResponse("Internal server error", 500);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await requireRole("ADMIN");
    if (!user) return unauthorizedResponse();
    if (!isValidObjectId(id)) return notFoundResponse("Package");

    const body = await req.json();
    const isToggle = Object.keys(body).length === 1 && ("isActive" in body || "isFeatured" in body);
    let updateData = body;

    if (!isToggle) {
      const parsed = packageSchema.safeParse(body);
      if (!parsed.success) return errorResponse(parsed.error.issues[0].message);
      updateData = parsed.data;
    } else if (typeof body.isActive !== "boolean" && typeof body.isFeatured !== "boolean") {
      return errorResponse("Invalid toggle value");
    }

    await connectDB();
    const pkg = await Package.findById(id);
    if (!pkg) return notFoundResponse("Package");

    Object.assign(pkg, updateData);
    await pkg.save();

    return successResponse({ ...pkg.toObject(), _id: pkg._id.toString() });
  } catch (err) {
    console.error("[PACKAGE_PATCH]", err);
    return errorResponse("Internal server error", 500);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await requireRole("ADMIN");
    if (!user) return unauthorizedResponse();
    if (!isValidObjectId(id)) return notFoundResponse("Package");

    await connectDB();
    const pkg = await Package.findById(id);
    if (!pkg) return notFoundResponse("Package");

    const activeBookings = await Booking.countDocuments({
      packageId: id,
      status: { $in: ["PENDING", "CONFIRMED", "PAID"] },
    });

    if (activeBookings > 0) {
      return errorResponse(`Cannot delete: ${activeBookings} active booking(s) use this package`, 409);
    }

    await pkg.deleteOne();
    return successResponse({ deleted: true });
  } catch (err) {
    console.error("[PACKAGE_DELETE]", err);
    return errorResponse("Internal server error", 500);
  }
}
