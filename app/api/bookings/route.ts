import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import Booking from "@/models/Booking";
import Package from "@/models/Package";
import User from "@/models/User";
import CancellationRequest from "@/models/CancellationRequest";
import { requireAuth } from "@/lib/rbac";
import { bookingSchema } from "@/lib/validations";
import { sendBookingConfirmation } from "@/services/email";
import { formatCurrency, formatDate } from "@/lib/utils";
import { successResponse, errorResponse, unauthorizedResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    if (!user) return unauthorizedResponse();

    await connectDB();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = 20;
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {};
    if (user.role === "CUSTOMER") query.customerId = user.id;
    if (status) query.status = status;

    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("packageId", "name category price")
        .populate("customerId", "name email phone")
        .lean(),
      Booking.countDocuments(query),
    ]);

    const cancellationRequests = user.role === "ADMIN" || user.role === "STAFF"
      ? await CancellationRequest.find({
          bookingId: { $in: bookings.map((b) => b._id) },
          status: "OPEN",
        }).lean()
      : [];
    const cancellationByBookingId = new Map(
      cancellationRequests.map((r) => [
        r.bookingId.toString(),
        {
          _id: r._id.toString(),
          reason: r.reason,
          status: r.status,
          createdAt: r.createdAt,
        },
      ])
    );

    return successResponse({
      bookings: bookings.map((b) => ({
        ...b,
        _id: b._id.toString(),
        paymentId: b.paymentId?.toString(),
        cancellationRequest: cancellationByBookingId.get(b._id.toString()) || null,
      })),
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("[BOOKINGS_GET]", err);
    return errorResponse("Internal server error", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    if (!user) return unauthorizedResponse();

    const body = await req.json();
    const parsed = bookingSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.issues[0].message);

    const { packageId, eventDate, guestCount, venue, notes } = parsed.data;

    await connectDB();

    const pkg = await Package.findOne({ _id: packageId, isActive: true });
    if (!pkg) return errorResponse("Package not found or unavailable", 404);

    if (guestCount < pkg.minGuests || guestCount > pkg.maxGuests) {
      return errorResponse(
        `Guest count must be between ${pkg.minGuests} and ${pkg.maxGuests} for this package`
      );
    }

    const booking = await Booking.create({
      customerId: user.id,
      packageId,
      eventDate: new Date(eventDate),
      guestCount,
      venue,
      notes,
      status: "PENDING",
      totalAmount: pkg.price,
    });

    const customer = await User.findById(user.id).lean();

    sendBookingConfirmation({
      customerName: (customer as { name: string })?.name || "Customer",
      customerEmail: (customer as { email: string })?.email || "",
      vendorName: "Camilo Catering",
      packageName: pkg.name,
      eventDate: formatDate(new Date(eventDate)),
      venue,
      guestCount,
      totalAmount: formatCurrency(pkg.price),
      bookingId: booking._id.toString(),
      status: "PENDING",
    }).catch(console.error);

    return successResponse({ ...booking.toObject(), _id: booking._id.toString() }, 201);
  } catch (err) {
    console.error("[BOOKINGS_POST]", err);
    return errorResponse("Internal server error", 500);
  }
}
