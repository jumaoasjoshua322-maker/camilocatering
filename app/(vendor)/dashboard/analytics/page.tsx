import { connectDB } from "@/lib/db";
import Booking from "@/models/Booking";
import Package from "@/models/Package";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Calendar, DollarSign } from "lucide-react";

export const metadata = { title: "Analytics" };

export default async function AnalyticsPage() {
  await connectDB();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  const [
    totalRevenue,
    monthRevenue,
    lastMonthRevenue,
    totalBookings,
    monthBookings,
    packageStats,
    recentRevenue,
  ] = await Promise.all([
    Booking.aggregate([
      { $match: { status: { $in: ["PAID", "COMPLETED"] } } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]),
    Booking.aggregate([
      { $match: { status: { $in: ["PAID", "COMPLETED"] }, createdAt: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]),
    Booking.aggregate([
      {
        $match: {
          status: { $in: ["PAID", "COMPLETED"] },
          createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
        },
      },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]),
    Booking.countDocuments(),
    Booking.countDocuments({ createdAt: { $gte: startOfMonth } }),
    Package.aggregate([
      {
        $lookup: {
          from: "bookings",
          localField: "_id",
          foreignField: "packageId",
          as: "bookings",
        },
      },
      {
        $project: {
          name: 1,
          category: 1,
          price: 1,
          bookingCount: { $size: "$bookings" },
          revenue: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: "$bookings",
                    cond: { $in: ["$$this.status", ["PAID", "COMPLETED"]] },
                  },
                },
                in: "$$this.totalAmount",
              },
            },
          },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 5 },
    ]),
    Booking.aggregate([
      { $match: { status: { $in: ["PAID", "COMPLETED"] }, createdAt: { $gte: startOfLastMonth } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: "$totalAmount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $limit: 30 },
    ]),
  ]);

  const revenue = totalRevenue[0]?.total || 0;
  const thisMonth = monthRevenue[0]?.total || 0;
  const lastMonth = lastMonthRevenue[0]?.total || 0;
  const growth = lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : 0;

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
                <DollarSign className="h-4 w-4 text-green-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-neutral-900 dark:text-white">
              {formatCurrency(revenue)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-neutral-500">This Month</span>
              <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                <Calendar className="h-4 w-4 text-blue-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-neutral-900 dark:text-white">
              {formatCurrency(thisMonth)}
            </div>
            {growth !== 0 && (
              <p className={`text-xs mt-1 flex items-center gap-1 ${growth > 0 ? "text-green-600" : "text-red-600"}`}>
                <TrendingUp className="h-3 w-3" />
                {growth > 0 ? "+" : ""}{growth.toFixed(1)}% vs last month
              </p>
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
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-neutral-500">This Month</span>
              <div className="h-8 w-8 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
                <Calendar className="h-4 w-4 text-amber-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-neutral-900 dark:text-white">{monthBookings}</div>
          </CardContent>
        </Card>
      </div>

      {/* Top Packages */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Packages</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {packageStats.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-neutral-500">No data yet</div>
          ) : (
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {packageStats.map((pkg: { _id: string; name: string; category: string; bookingCount: number; revenue: number }) => (
                <div key={pkg._id.toString()} className="flex items-center justify-between px-6 py-4">
                  <div>
                    <p className="font-medium text-neutral-900 dark:text-white">{pkg.name}</p>
                    <p className="text-xs text-neutral-400">{pkg.category} • {pkg.bookingCount} bookings</p>
                  </div>
                  <span className="text-lg font-bold text-amber-600">{formatCurrency(pkg.revenue)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Revenue Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Trend (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          {recentRevenue.length === 0 ? (
            <div className="py-10 text-center text-sm text-neutral-500">No revenue data yet</div>
          ) : (
            <div className="h-64 flex items-end gap-2">
              {recentRevenue.map((day: { _id: string; revenue: number; count: number }) => {
                const maxRevenue = Math.max(...recentRevenue.map((d: { revenue: number }) => d.revenue));
                const height = (day.revenue / maxRevenue) * 100;
                return (
                  <div key={day._id} className="flex-1 flex flex-col items-center gap-1 group">
                    <div
                      className="w-full bg-amber-500 rounded-t hover:bg-amber-600 transition-colors cursor-pointer"
                      style={{ height: `${height}%` }}
                      title={`${day._id}: ${formatCurrency(day.revenue)} (${day.count} bookings)`}
                    />
                    <span className="text-[8px] text-neutral-400 rotate-45 origin-left hidden group-hover:block">
                      {new Date(day._id).getDate()}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
