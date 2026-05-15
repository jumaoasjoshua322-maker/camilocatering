import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import Package from "@/models/Package";
import { requireRole } from "@/lib/rbac";
import { packageSchema } from "@/lib/validations";
import { successResponse, errorResponse, unauthorizedResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const featured = searchParams.get("featured");
    const all = searchParams.get("all"); // admin: include inactive

    const query: Record<string, unknown> = {};
    if (!all) query.isActive = true;
    if (category) query.category = category;
    if (featured) query.isFeatured = true;

    const packages = await Package.find(query).sort({ isFeatured: -1, price: 1 }).lean();

    return successResponse(
      packages.map((p) => ({ ...p, _id: p._id.toString() }))
    );
  } catch (err) {
    console.error("[PACKAGES_GET]", err);
    return errorResponse("Internal server error", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole("ADMIN");
    if (!user) return unauthorizedResponse();

    const body = await req.json();
    const parsed = packageSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.issues[0].message);

    await connectDB();
    const pkg = await Package.create(parsed.data);

    return successResponse({ ...pkg.toObject(), _id: pkg._id.toString() }, 201);
  } catch (err) {
    console.error("[PACKAGES_POST]", err);
    return errorResponse("Internal server error", 500);
  }
}
