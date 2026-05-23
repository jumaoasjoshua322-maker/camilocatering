import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const ADMIN_ROUTES = ["/dashboard"];
const CUSTOMER_ROUTES = ["/bookings"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const user = req.auth?.user;

  const isPublic =
    pathname === "/" ||
    pathname === "/services" ||
    pathname === "/about" ||
    pathname === "/contact" ||
    pathname === "/login" ||
    pathname === "/register" ||
    pathname.startsWith("/packages/") ||
    pathname.startsWith("/book") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/register") ||
    pathname.startsWith("/api/packages") ||
    pathname.startsWith("/api/company") ||
    pathname.startsWith("/api/contact") ||
    pathname.startsWith("/api/payments/webhook");

  if (isPublic) return NextResponse.next();

  if (!user) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Dashboard: ADMIN or STAFF only
  if (ADMIN_ROUTES.some((r) => pathname.startsWith(r))) {
    if (user.role !== "ADMIN" && user.role !== "STAFF") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  // Customer routes: any authenticated user
  if (CUSTOMER_ROUTES.some((r) => pathname.startsWith(r))) {
    if (!user) return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|uploads/|.*\\.svg|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.webp|.*\\.ico).*)",
  ],
};
