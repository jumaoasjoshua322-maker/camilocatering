import Link from "next/link";
import { connectDB } from "@/lib/db";
import Booking from "@/models/Booking";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Calendar, PhilippinePeso, CalendarRange, ChevronRight } from "lucide-react";
import { RevenueTrendChart, type DailyRevenuePoint } from "./revenue-trend-chart";

export const metadata = { title: "Analytics" };
export const dynamic = "force-dynamic";

const PAID_STATUSES = ["PAID", "COMPLETED"];

const RANGES = {
  "30d": { label: "Last 30 days", days: 30 },
  "90d": { label: "Last 90 days", days: 90 },
  ytd: { label: "Year to date", days: null },
  all: { label: "All time", days: null },
} as const;

type RangeKey = keyof typeof RANGES;
const RANGE_KEYS = Object.keys(RANGES) as RangeKey[];

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function rangeStart(key: RangeKey, now: Date): Date | null {
  if (key === "all") return null;
  if (key === "ytd") return new Date(now.getFullYear(), 0, 1);
  const days = RANGES[key].days;
  return days ? startOfDay(new Date(now.getTime() - (days - 1) * 24 * 60 * 60 * 1000)) : null;
}

interface Props {
  searchParams: Promise<{ range?: string }>;
}

export default async function AnalyticsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const range: RangeKey = (RANGE_KEYS.includes(sp.range as RangeKey) ? sp.range : "90d") as RangeKey;

  await connectDB();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

  // Trend always shows Last 30 days regardless of card range.
  const trendStart = startOfDay(new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000));
  const trendEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const topStart = rangeStart(range, now);

  // For bookings without a paidAt (legacy/seed data), fall back to updatedAt.
  // ifNull picks the first non-null value.
  const paidAtExpr = { $ifNull: ["$paidAt", "$updatedAt"] };

  const topMatch: Record<string, unknown> = { status: { $in: PAID_STATUSES } };
  if (topStart) {
    // Restrict by paidAt-or-fallback. We do this in a $expr so $ifNull works inside $match.
    topMatch.$expr = { $gte: [paidAtExpr, topStart] };
  }

  const [
    totalRevenue,
    monthRevenue,
    lastMonthRevenue,
    totalBookings,
    monthBookings,
    packageStats,
    trendBuckets,
  ] = await Promise.all([
    Booking.aggregate([
      { $match: { status: { $in: PAID_STATUSES } } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]),
    Booking.aggregate([
      { $match: { status: { $in: PAID_STATUSES }, eventDate: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]),
    Booking.aggregate([
      {
        $match: {
          status: { $in: PAID_STATUSES },
          eventDate: { $gte: startOfLastMonth, $lte: endOfLastMonth },
        },
      },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]),
    Booking.countDocuments(),
    Booking.countDocuments({ createdAt: { $gte: startOfMonth } }),
    Booking.aggregate([
      { $match: topMatch },
      {
        $group: {
          _id: "$packageId",
          revenue: { $sum: "$totalAmount" },
          bookingCount: { $sum: 1 },
          lastPaidAt: { $max: paidAtExpr },
        },
      },
      { $sort: { revenue: -1, bookingCount: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "packages",
          localField: "_id",
          foreignField: "_id",
          as: "package",
        },
      },
      { $unwind: { path: "$package", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          revenue: 1,
          bookingCount: 1,
          lastPaidAt: 1,
          name: { $ifNull: ["$package.name", "(deleted package)"] },
          category: { $ifNull: ["$package.category", "OTHER"] },
        },
      },
    ]),
    Booking.aggregate([
      {
        $match: {
          status: { $in: PAID_STATUSES },
          eventDate: { $gte: trendStart, $lt: trendEnd },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$eventDate" } },
          revenue: { $sum: "$totalAmount" },
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  const revenue = totalRevenue[0]?.total || 0;
  const thisMonth = monthRevenue[0]?.total || 0;
  const lastMonth = lastMonthRevenue[0]?.total || 0;
  const growth = lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : 0;

  // Build a contiguous 30-day series.
  const trendByDate = new Map<string, { revenue: number; count: number }>(
    (trendBuckets as { _id: string; revenue: number; count: number }[]).map((b) => [
      b._id,
      { revenue: b.revenue, count: b.count },
    ])
  );
  const labelFmt = new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric" });
  const trend: DailyRevenuePoint[] = [];
  for (let i = 0; i < 30; i++) {
    const d = new Date(trendStart.getTime() + i * 24 * 60 * 60 * 1000);
    const key = isoDate(d);
    const hit = trendByDate.get(key);
    trend.push({
      date: key,
      label: labelFmt.format(d),
      revenue: hit?.revenue ?? 0,
      bookings: hit?.count ?? 0,
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Analytics</h1>
        <p className="text-sm text-neutral-500 mt-1">Revenue insights and performance metrics</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-neutral-500">Total Revenue</span>
              <div className="h-8 w-8 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
                <PhilippinePeso className="h-4 w-4 text-green-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-neutral-900 dark:text-white">
              {formatCurrency(revenue)}
            </div>
            <p className="text-xs text-neutral-400 mt-1">Paid &amp; completed bookings</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-neutral-500">Revenue This Month</span>
              <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                <Calendar className="h-4 w-4 text-blue-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-neutral-900 dark:text-white">
              {formatCurrency(thisMonth)}
            </div>
            {growth !== 0 ? (
              <p className={`text-xs mt-1 flex items-center gap-1 ${growth > 0 ? "text-green-600" : "text-red-600"}`}>
                <TrendingUp className="h-3 w-3" />
                {growth > 0 ? "+" : ""}{growth.toFixed(1)}% vs last month
              </p>
            ) : (
              <p className="text-xs text-neutral-400 mt-1">No comparable activity last month</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-neutral-500">Total Bookings</span>
              <div className="h-8 w-8 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
                <BarChart3 className="h-4 w-4 text-purple-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-neutral-900 dark:text-white">{totalBookings}</div>
            <p className="text-xs text-neutral-400 mt-1">All statuses</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-neutral-500">Bookings This Month</span>
              <div className="h-8 w-8 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
                <CalendarRange className="h-4 w-4 text-amber-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-neutral-900 dark:text-white">{monthBookings}</div>
            <p className="text-xs text-neutral-400 mt-1">Created since {startOfMonth.toLocaleDateString("en-PH", { month: "short", day: "numeric" })}</p>
          </CardContent>
        </Card>
      </div>

      {/* Top Packages */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Top Performing Packages</CardTitle>
              <p className="text-xs text-neutral-400 mt-1">By revenue · paid &amp; completed only</p>
            </div>
            <div className="inline-flex items-center gap-1 rounded-lg border border-neutral-200 bg-neutral-50 p-1 dark:border-neutral-800 dark:bg-neutral-900">
              {RANGE_KEYS.map((key) => {
                const active = key === range;
                return (
                  <Link
                    key={key}
                    href={`/dashboard/analytics?range=${key}`}
                    scroll={false}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                      active
                        ? "bg-white text-amber-700 shadow-sm dark:bg-neutral-800 dark:text-amber-400"
                        : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
                    }`}
                  >
                    {RANGES[key].label}
                  </Link>
                );
              })}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {packageStats.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-neutral-500">
              No paid bookings in this range
            </div>
          ) : (
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {(packageStats as {
                _id: string;
                name: string;
                category: string;
                bookingCount: number;
                revenue: number;
                lastPaidAt: Date | null;
              }[]).map((pkg) => (
                <Link
                  key={pkg._id.toString()}
                  href={`/dashboard/bookings?packageId=${pkg._id.toString()}&status=PAID`}
                  className="group flex items-start justify-between gap-4 px-6 py-4 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-neutral-900 dark:text-white truncate group-hover:text-amber-600 transition-colors">
                      {pkg.name}
                    </p>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      {pkg.category} · {pkg.bookingCount} {pkg.bookingCount === 1 ? "booking" : "bookings"}
                    </p>
                    {pkg.lastPaidAt && (
                      <p className="text-xs text-neutral-400 mt-0.5">
                        Last paid {formatDate(pkg.lastPaidAt)}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 whitespace-nowrap">
                    <span className="text-lg font-bold text-amber-600">
                      {formatCurrency(pkg.revenue)}
                    </span>
                    <ChevronRight className="h-4 w-4 text-neutral-300 group-hover:text-amber-600 transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Revenue Trend */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-1">
            <CardTitle>Revenue Trend (Last 30 Days)</CardTitle>
            <p className="text-xs text-neutral-400">By event date · paid &amp; completed only</p>
          </div>
        </CardHeader>
        <CardContent>
          <RevenueTrendChart data={trend} />
        </CardContent>
      </Card>
    </div>
  );
}
