import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import CompanySettings from "@/models/CompanySettings";
import { requireRole } from "@/lib/rbac";
import { companySettingsSchema } from "@/lib/validations";
import { isSameOrigin } from "@/lib/security";
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from "@/lib/api-response";

export async function GET() {
  try {
    await connectDB();
    const settings = await CompanySettings.findOne().lean();
    return successResponse(settings);
  } catch (err) {
    console.error("[COMPANY_SETTINGS_GET]", err);
    return errorResponse("Internal server error", 500);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    if (!isSameOrigin(req)) return forbiddenResponse();
    const user = await requireRole("ADMIN");
    if (!user) return unauthorizedResponse();

    const body = await req.json();
    const parsed = companySettingsSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.issues[0].message);

    await connectDB();
    const settings = await CompanySettings.findOneAndUpdate(
      {},
      { $set: parsed.data },
      { new: true, upsert: true }
    );

    return successResponse(settings);
  } catch (err) {
    console.error("[COMPANY_SETTINGS_PATCH]", err);
    return errorResponse("Internal server error", 500);
  }
}
