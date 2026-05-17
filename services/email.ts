import nodemailer from "nodemailer";
import { getPublicSettings } from "@/lib/settings";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.mailtrap.io",
  port: Number(process.env.SMTP_PORT) || 587,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export interface BookingEmailData {
  customerName: string;
  customerEmail: string;
  packageName: string;
  eventDate: string;
  venue: string;
  guestCount: number;
  totalAmount: string;
  bookingId: string;
  status: string;
}

export async function sendBookingConfirmation(data: BookingEmailData) {
  // Single source of truth for the brand name. Settings already backs the
  // public site and the contact handler, so emails inherit any rebrand.
  const settings = await getPublicSettings();
  const vendorName = settings.name;

  const subject = `Booking ${data.status} — ${vendorName}`;
  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
      <div style="background:#c8861e;padding:24px;border-radius:12px 12px 0 0;">
        <h1 style="color:white;margin:0;font-size:24px;">${vendorName}</h1>
      </div>
      <div style="background:#fff;padding:32px;border:1px solid #e5e5e5;border-top:none;border-radius:0 0 12px 12px;">
        <h2 style="color:#171717;margin-top:0;">Booking ${data.status}</h2>
        <p style="color:#525252;">Hi ${data.customerName},</p>
        <p style="color:#525252;">Your booking with <strong>${vendorName}</strong> is now <strong>${data.status}</strong>.</p>
        <div style="background:#fdf8f0;border:1px solid #f4dba8;border-radius:8px;padding:20px;margin:24px 0;">
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:6px 0;color:#737373;font-size:14px;">Booking ID</td><td style="padding:6px 0;font-size:14px;font-weight:600;">#${data.bookingId.slice(-8).toUpperCase()}</td></tr>
            <tr><td style="padding:6px 0;color:#737373;font-size:14px;">Package</td><td style="padding:6px 0;font-size:14px;">${data.packageName}</td></tr>
            <tr><td style="padding:6px 0;color:#737373;font-size:14px;">Event Date</td><td style="padding:6px 0;font-size:14px;">${data.eventDate}</td></tr>
            <tr><td style="padding:6px 0;color:#737373;font-size:14px;">Venue</td><td style="padding:6px 0;font-size:14px;">${data.venue}</td></tr>
            <tr><td style="padding:6px 0;color:#737373;font-size:14px;">Guests</td><td style="padding:6px 0;font-size:14px;">${data.guestCount}</td></tr>
            <tr><td style="padding:6px 0;color:#737373;font-size:14px;">Total</td><td style="padding:6px 0;font-size:14px;font-weight:700;color:#c8861e;">${data.totalAmount}</td></tr>
          </table>
        </div>
        <p style="color:#737373;font-size:13px;">Questions? Reply to this email or contact us directly.</p>
      </div>
    </div>
  `;

  // In development without SMTP config, just log.
  if (!process.env.SMTP_USER) {
    console.log(`[EMAIL MOCK] To: ${data.customerEmail} | Subject: ${subject}`);
    return;
  }

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || "noreply@camilocatering.com",
    to: data.customerEmail,
    subject,
    html,
  });
}
