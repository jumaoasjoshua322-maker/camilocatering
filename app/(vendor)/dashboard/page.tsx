import Link from "next/link";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Booking from "@/models/Booking";
import Package from "@/models/Package";
import User from "@/models/User";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { KpiSparkline } from "@/components/ui/kpi-sparkline";
import {
  CalendarDays,
  Package as PackageIcon,
  PhilippinePeso,
  Users,
  AlertCircle,
  ChevronRight,
} from "lucide-react";
import type { BookingStatus } from "@/types";

const statusVariant: Record<BookingStatus, "default" | "success" | "warning" | "danger" | "neutral"> = {
  PENDING: "warning",
  CONFIRMED: "default",
  PAID: "success",
  COMPLETED: "success",
  CANCELLED: "danger",
};

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default async function DashboardPage() {
  const session = await auth();
  await connectDB();

  // 14-day window for KPI sparklines.
  const today = new Date();
  const sparkStart = startOfDay(new Date(today.getTime() - 13 * 24 * 60 * 60 * 1000));

  const [
    totalBookings,
    pendingBookings,
    totalPackages,
    totalCustomers,
    revenueResult,
    recentBookings,
    bookingsByDay,
    revenueByDay,
  ] = await Promise.all([
    Booking.countDocuments(),
    Booking.countDocuments({ status: "PENDING" }),
    Package.countDocuments({ isActive: true }),
    User.countDocuments({ role: "CUSTOMER" }),
    Booking.aggregate([
      { $match: { status: { $in: ["PAID", "COMPLETED"] } } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]),
    Booking.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("packageId", "name category")
      .populate("customerId", "name email")
      .lean(),
    Booking.aggregate([
      { $match: { createdAt: { $gte: sparkStart } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          c: { $sum: 1 },
        },
      },
    ]),
    Booking.aggregate([
      {
        $match: {
          status: { $in: ["PAID", "COMPLETED"] },
          eventDate: { $gte: sparkStart },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$eventDate" } },
          v: { $sum: "$totalAmount" },
        },
      },
    ]),
  ]);

  const revenue = revenueResult[0]?.total || 0;

  // Build contiguous 14-day series (zero-fill missing days).
  const bookingsMap = new Map<string, number>(
    (bookingsByDay as { _id: string; c: number }[]).map((b) => [b._id, b.c])
  );
  const revenueMap = new Map<string, number>(
    (revenueByDay as { _id: string; v: number }[]).map((b) => [b._id, b.v])
  );
  const bookingsSpark: { d: string; v: number }[] = [];
  const revenueSpark: { d: string; v: number }[] = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date(sparkStart.getTime() + i * 24 * 60 * 60 * 1000);
    const key = isoDate(d);
    bookingsSpark.push({ d: key, v: bookingsMap.get(key) ?? 0 });
    revenueSpark.push({ d: key, v: revenueMap.get(key) ?? 0 });
  }

  const tiles = [
    {
      label: "Total Bookings",
      value: String(totalBookings),
      href: "/dashboard/bookings",
      icon: CalendarDays,
      color: "text-blue-700",
      bg: "bg-blue-50 dark:bg-blue-900/20",
      sparkColor: "#1d4ed8",
      spark: bookingsSpark,
    },
    {
      label: "Pending Review",
      value: String(pendingBookings),
      href: "/dashboard/bookings?status=PENDING",
      icon: AlertCircle,
      color: "text-amber-700",
      bg: "bg-amber-50 dark:bg-amber-900/20",
      sparkColor: "#b45309",
      spark: bookingsSpark,
      pulse: pendingBookings > 0,
    },
    {
      label: "Active Packages",
      value: String(totalPackages),
      href: "/dashboard/packages",
      icon: PackageIcon,
      color: "text-purple-700",
      bg: "bg-purple-50 dark:bg-purple-900/20",
      sparkColor: "#7e22ce",
      spark: undefined,
    },
    {
      label: "Total Customers",
      value: String(totalCustomers),
      href: "/dashboard/bookings",
      icon: Users,
      color: "text-green-700",
      bg: "bg-green-50 dark:bg-green-900/20",
      sparkColor: "#15803d",
      spark: undefined,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Overview</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Welcome back, {session?.user.name?.split(" ")[0] ?? "there"}.
          {pendingBookings > 0 && (
            <>
              {" "}
              <Link
                href="/dashboard/bookings?status=PENDING"
                className="text-amber-700 hover:text-amber-800 font-medium underline-offset-4 hover:underline"
              >
                {pendingBookings} {pendingBookings === 1 ? "booking needs" : "bookings need"} your review.
              </Link>
            </>
          )}
        </p>
      </div>

      {/* KPI tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {tiles.map((t) => (
          <Link
            key={t.label}
            href={t.href}
            className="group block rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 hover:border-neutral-300 hover:shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-700 focus-visible:ring-offset-2"
          >
            <div className="flex items-start justify-between mb-3">
              <span className="text-sm text-neutral-500">{t.label}</span>
              <div className={`relative h-8 w-8 rounded-lg ${t.bg} flex items-center justify-center`}>
                <t.icon className={`h-4 w-4 ${t.color}`} />
                {t.pulse && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-500 opacity-70" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-600" />
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-end justify-between gap-2">
              <span className="text-2xl font-semibold text-neutral-900 dark:text-white tabular-nums">
                {t.value}
              </span>
              <ChevronRight className="h-4 w-4 text-neutral-300 group-hover:text-neutral-500 transition-colors" />
            </div>
            {t.spark && (
              <div className={t.color} aria-hidden>
                <KpiSparkline data={t.spark} />
              </div>
            )}
          </Link>
        ))}
      </div>

      {/* Revenue tile (wide) */}
      <Link
        href="/dashboard/analytics"
        className="group block rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 hover:border-neutral-300 hover:shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-700 focus-visible:ring-offset-2"
      >
        <div className="flex items-center justify-between gap-6">
          <div className="min-w-0">
            <p className="text-sm text-neutral-500 mb-1">Total Revenue</p>
            <p className="text-3xl font-semibold text-neutral-900 dark:text-white tabular-nums">
              {formatCurrency(revenue)}
            </p>
            <p className="text-xs text-neutral-400 mt-1">Paid &amp; completed bookings · view full analytics</p>
          </div>
          <div className="hidden sm:flex items-center gap-4">
            <div className="w-40 sm:w-56 text-emerald-700">
              <KpiSparkline data={revenueSpark} />
            </div>
            <div className="h-12 w-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
              <PhilippinePeso className="h-6 w-6 text-emerald-700" />
            </div>
          </div>
        </div>
      </Link>

      {/* Recent Bookings */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent bookings</CardTitle>
            <Link
              href="/dashboard/bookings"
              className="text-sm text-neutral-500 hover:text-amber-700 font-medium"
            >
              View all →
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {recentBookings.length === 0 ? (
            <div className="px-6 pb-6">
              <EmptyState
                icon={CalendarDays}
                title="No bookings yet"
                description="Recent bookings will appear here as customers book your packages."
              />
            </div>
          ) : (
            <>
              {/* Mobile: list */}
              <div className="lg:hidden divide-y divide-neutral-100 dark:divide-neutral-800">
                {recentBookings.map((b) => {
                  const pkg = b.packageId as unknown as { name: string };
                  const customer = b.customerId as unknown as { name: string; email: string };
                  return (
                    <Link
                      key={b._id.toString()}
                      href={`/dashboard/bookings?packageId=${(b.packageId as { _id?: { toString(): string } })?._id?.toString() ?? ""}`}
                      className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">
                          {customer?.name || "Customer"}
                        </p>
                        <p className="text-xs text-neutral-400 truncate">{pkg?.name}</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <Badge variant={statusVariant[b.status as BookingStatus]}>{b.status}</Badge>
                        <span className="text-sm font-semibold tabular-nums">
                          {formatCurrency(b.totalAmount)}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>

              {/* Desktop: table */}
              <div className="hidden lg:block">
                <table className="w-full text-sm">
                  <thead className="text-left text-xs uppercase tracking-wide text-neutral-500 border-b border-neutral-100 dark:border-neutral-800">
                    <tr>
                      <th className="px-6 py-2.5 font-medium">Status</th>
                      <th className="px-4 py-2.5 font-medium">Customer</th>
                      <th className="px-4 py-2.5 font-medium">Package</th>
                      <th className="px-4 py-2.5 font-medium">Event date</th>
                      <th className="px-6 py-2.5 font-medium text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                    {recentBookings.map((b) => {
                      const pkg = b.packageId as unknown as { name: string; category: string };
                      const customer = b.customerId as unknown as { name: string; email: string };
                      return (
                        <tr
                          key={b._id.toString()}
                          className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                        >
                          <td className="px-6 py-3">
                            <Badge variant={statusVariant[b.status as BookingStatus]}>
                              {b.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 min-w-0">
                            <p className="font-medium text-neutral-900 dark:text-white truncate">
                              {customer?.name || "Customer"}
                            </p>
                            <p className="text-xs text-neutral-500 truncate">{customer?.email}</p>
                          </td>
                          <td className="px-4 py-3 min-w-0">
                            <p className="text-neutral-700 dark:text-neutral-300 truncate">
                              {pkg?.name}
                            </p>
                            <p className="text-xs text-neutral-500">{pkg?.category}</p>
                          </td>
                          <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300 whitespace-nowrap">
                            {formatDate(b.eventDate)}
                          </td>
                          <td className="px-6 py-3 text-right font-semibold text-neutral-900 dark:text-white tabular-nums whitespace-nowrap">
                            {formatCurrency(b.totalAmount)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
