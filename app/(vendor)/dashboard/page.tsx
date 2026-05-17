import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Booking from "@/models/Booking";
import Package from "@/models/Package";
import User from "@/models/User";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { CalendarDays, Package as PackageIcon, PhilippinePeso, Users } from "lucide-react";
import type { BookingStatus } from "@/types";

const statusVariant: Record<BookingStatus, "default" | "success" | "warning" | "danger" | "neutral"> = {
  PENDING: "warning",
  CONFIRMED: "default",
  PAID: "success",
  COMPLETED: "success",
  CANCELLED: "danger",
};

export default async function DashboardPage() {
  const session = await auth();
  await connectDB();

  const [totalBookings, pendingBookings, totalPackages, totalCustomers, revenueResult, recentBookings] =
    await Promise.all([
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
        .limit(6)
        .populate("packageId", "name category")
        .populate("customerId", "name email")
        .lean(),
    ]);

  const revenue = revenueResult[0]?.total || 0;

  const stats = [
    { label: "Total Bookings", value: totalBookings, icon: CalendarDays, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20" },
    { label: "Pending Review", value: pendingBookings, icon: CalendarDays, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-900/20" },
    { label: "Active Packages", value: totalPackages, icon: PackageIcon, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-900/20" },
    { label: "Total Customers", value: totalCustomers, icon: Users, color: "text-green-600", bg: "bg-green-50 dark:bg-green-900/20" },
    { label: "Total Revenue", value: formatCurrency(revenue), icon: PhilippinePeso, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/20", wide: true },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Overview</h1>
        <p className="text-sm text-neutral-500 mt-1">Welcome back, {session?.user.name}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.filter(s => !s.wide).map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-neutral-500">{label}</span>
                <div className={`h-8 w-8 rounded-lg ${bg} flex items-center justify-center`}>
                  <Icon className={`h-4 w-4 ${color}`} />
                </div>
              </div>
              <div className="text-2xl font-bold text-neutral-900 dark:text-white">{value}</div>
            </CardContent>
          </Card>
        ))}
        {stats.filter(s => s.wide).map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label} className="col-span-2 lg:col-span-4">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-500 mb-1">{label}</p>
                <p className="text-3xl font-bold text-neutral-900 dark:text-white">{value}</p>
              </div>
              <div className={`h-12 w-12 rounded-xl ${bg} flex items-center justify-center`}>
                <Icon className={`h-6 w-6 ${color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Bookings */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Bookings</CardTitle>
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
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {recentBookings.map((b) => {
                const pkg = b.packageId as unknown as { name: string };
                const customer = b.customerId as unknown as { name: string; email: string };
                return (
                  <div key={b._id.toString()} className="flex items-center justify-between px-6 py-4 gap-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">
                        {customer?.name || "Customer"}
                      </p>
                      <p className="text-xs text-neutral-400 truncate">{pkg?.name}</p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-xs text-neutral-400 hidden sm:block">{formatDate(b.eventDate)}</span>
                      <Badge variant={statusVariant[b.status as BookingStatus] || "neutral"}>
                        {b.status}
                      </Badge>
                      <span className="text-sm font-semibold text-neutral-900 dark:text-white">
                        {formatCurrency(b.totalAmount)}
                      </span>
                    </div>
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
