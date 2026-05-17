import { NextRequest } from "next/server";
import nodemailer from "nodemailer";
import { contactMessageSchema } from "@/lib/validations";
import { successResponse, errorResponse, forbiddenResponse } from "@/lib/api-response";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { isSameOrigin } from "@/lib/security";
import { connectDB } from "@/lib/db";
import CompanySettings from "@/models/CompanySettings";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    if (!isSameOrigin(req)) return forbiddenResponse();
    const ip = getClientIp(req);
    const limited = await rateLimit(`contact:${ip}`, 5, 15 * 60 * 1000);
    if (!limited.allowed) return errorResponse("Too many messages. Try again later.", 429);

    const body = await req.json();
    const parsed = contactMessageSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.issues[0].message);

    const { name, email, phone, message } = parsed.data;

    // Resolve recipient: company email if set, else env fallback.
    await connectDB();
    const settings = await CompanySettings.findOne().lean();
    const to =
      settings?.email ||
      process.env.EMAIL_FROM ||
      "noreply@camilocatering.com";

    if (process.env.SMTP_USER) {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.mailtrap.io",
        port: Number(process.env.SMTP_PORT) || 587,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      await transporter.sendMail({
        from: process.env.EMAIL_FROM || "noreply@camilocatering.com",
        to,
        replyTo: email,
        subject: `New contact message from ${name}`,
        text:
`From: ${name} <${email}>${phone ? `\nPhone: ${phone}` : ""}

${message}`,
      });
    } else {
      console.log(`[CONTACT MOCK] to=${to} from=${email} name=${name}`);
    }

    return successResponse({ delivered: true });
  } catch (err) {
    console.error("[CONTACT_POST]", err);
    return errorResponse("Failed to send message", 500);
  }
}
