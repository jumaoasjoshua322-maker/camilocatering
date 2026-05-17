import { NextRequest } from "next/server";
import { requireRole } from "@/lib/rbac";
import { uploadImage } from "@/services/storage";
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from "@/lib/api-response";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { isSameOrigin } from "@/lib/security";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    if (!isSameOrigin(req)) return forbiddenResponse();
    const user = await requireRole("ADMIN");
    if (!user) return unauthorizedResponse();

    const ip = getClientIp(req);
    const limited = await rateLimit(`upload:${ip}:${user.id}`, 30, 10 * 60 * 1000);
    if (!limited.allowed) return errorResponse("Too many uploads. Try again later.", 429);

    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return errorResponse("No file provided");

    const result = await uploadImage(file);
    return successResponse(result, 201);
  } catch (err) {
    console.error("[UPLOAD]", err);
    const msg = err instanceof Error ? err.message : "Upload failed";
    return errorResponse(msg, 400);
  }
}
