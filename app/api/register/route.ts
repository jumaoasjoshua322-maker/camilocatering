import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { registerSchema } from "@/lib/validations";
import { successResponse, errorResponse, forbiddenResponse } from "@/lib/api-response";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { isSameOrigin } from "@/lib/security";

export async function POST(req: NextRequest) {
  try {
    if (!isSameOrigin(req)) return forbiddenResponse();
    const ip = getClientIp(req);
    const limited = await rateLimit(`register:${ip}`, 5, 15 * 60 * 1000);
    if (!limited.allowed) return errorResponse("Too many registration attempts. Please try again later.", 429);

    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.issues[0].message);

    const { name, email, password, phone } = parsed.data;

    await connectDB();

    const existing = await User.findOne({ email });
    if (existing) return errorResponse("Email already registered", 409);

    const hashed = await bcrypt.hash(password, 12);

    const user = await User.create({
      name,
      email,
      password: hashed,
      phone,
      role: "CUSTOMER",
    });

    return successResponse(
      { id: user._id.toString(), name: user.name, email: user.email, role: user.role },
      201
    );
  } catch (err) {
    console.error("[REGISTER]", err);
    return errorResponse("Internal server error", 500);
  }
}
