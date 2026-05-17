import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import Package from "@/models/Package";
import { requireRole } from "@/lib/rbac";
import { packageSchema } from "@/lib/validations";
import { isSameOrigin } from "@/lib/security";
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from "@/lib/api-response";
import type { PackageCategory } from "@/types";

const CATEGORIES: PackageCategory[] = ["WEDDING", "CORPORATE", "BIRTHDAY", "SOCIAL", "OTHER"];

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const featured = searchParams.get("featured");
    const all = searchParams.get("all"); // admin: include inactive
    const includeInactive = all === "1" || all === "true";

    const query: Record<string, unknown> = {};
    if (includeInactive) {
      const user = await requireRole("ADMIN", "STAFF");
      if (!user) return unauthorizedResponse();
    } else {
      query.isActive = true;
    }
    if (category) {
      if (!CATEGORIES.includes(category as PackageCategory)) return errorResponse("Invalid category");
      query.category = category;
    }
    if (featured === "1" || featured === "true") query.isFeatured = true;

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
    if (!isSameOrigin(req)) return forbiddenResponse();
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
