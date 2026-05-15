import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Booking from "@/models/Booking";
import Payment from "@/models/Payment";
import CancellationRequest from "@/models/CancellationRequest";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, CalendarDays, MapPin, Users, Package as PackageIcon } from "lucide-react";
import Link from "next/link";
import { PaymentButton } from "./payment-button";
import { CancelBookingButton } from "./cancel-booking-button";
import { CancellationRequestButton } from "./cancellation-request-button";
import { BookingAutoRefresh } from "./booking-auto-refresh";
import type { BookingStatus } from "@/types";

const statusVariant: Record<BookingStatus, "default" | "success" | "warning" | "danger" | "neutral"> = {
  PENDING: "warning",
  CONFIRMED: "default",
  PAID: "success",
  COMPLETED: "success",
  CANCELLED: "danger",
};

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  return { title: `Booking #${id.slice(-8).toUpperCase()}` };
}

export default async function BookingDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  await connectDB();

  const booking = await Booking.findById(id)
    .populate("packageId", "name category price inclusions")
    .lean();

  if (!booking) notFound();

  if (booking.customerId.toString() !== session.user.id) {
    redirect("/bookings");
  }

  const payment = booking.paymentId
    ? await Payment.findById(booking.paymentId).lean()
    : null;
  const cancellationRequest = await CancellationRequest.findOne({
    bookingId: id,
    customerId: session.user.id,
    status: "OPEN",
  }).lean();

  const pkg = booking.packageId as unknown as {
    name: string;
    category: string;
    price: number;
    inclusions: string[];
  };

  const canPay = booking.status === "CONFIRMED" && (!payment || payment.status !== "SUCCEEDED");
  const canCancel = booking.status === "PENDING" || booking.status === "CONFIRMED";
  const canRequestCancellation = booking.status === "PAID";

  return (
    <div className="flex flex-col gap-6">
      <BookingAutoRefresh />
      <div className="flex flex-col gap-4">
        <Link
          href="/bookings"
          className="inline-flex w-fit items-center gap-2 rounded-lg border border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-50 hover:text-neutral-900 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
              Booking #{id.slice(-8).toUpperCase()}
            </h1>
            <p className="text-sm text-neutral-500 mt-1">
              Booked on {formatDate(booking.createdAt)}
            </p>
          </div>
          <Badge variant={statusVariant[booking.status as BookingStatus]} className="text-sm px-3 py-1">
            {booking.status}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Event Details</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <CalendarDays className="h-5 w-5 text-neutral-400" />
                <div>
                  <p className="text-sm text-neutral-500">Event Date</p>
                  <p className="font-medium text-neutral-900 dark:text-white">
                    {formatDate(booking.eventDate)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-neutral-400" />
                <div>
                  <p className="text-sm text-neutral-500">Venue</p>
                  <p className="font-medium text-neutral-900 dark:text-white">{booking.venue}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-neutral-400" />
                <div>
                  <p className="text-sm text-neutral-500">Guest Count</p>
                  <p className="font-medium text-neutral-900 dark:text-white">
                    {booking.guestCount} guests
                  </p>
                </div>
              </div>
              {booking.notes && (
                <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800">
                  <p className="text-sm text-neutral-500 mb-1">Special Requests</p>
                  <p className="text-sm text-neutral-700 dark:text-neutral-300">{booking.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Package Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-3 mb-4">
                <PackageIcon className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-neutral-900 dark:text-white">{pkg.name}</p>
                  <Badge variant="neutral" className="mt-1">{pkg.category}</Badge>
                </div>
              </div>
              {pkg.inclusions && pkg.inclusions.length > 0 && (
                <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800">
                  <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
                    Inclusions
                  </p>
                  <ul className="flex flex-col gap-2">
                    {pkg.inclusions.map((inc, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                        {inc}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>Payment Summary</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex items-center justify-between py-3 border-b border-neutral-100 dark:border-neutral-800">
                <span className="text-neutral-500">Package Price</span>
                <span className="font-semibold text-neutral-900 dark:text-white">
                  {formatCurrency(booking.totalAmount)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-neutral-900 dark:text-white">Total</span>
                <span className="text-2xl font-bold text-amber-600">
                  {formatCurrency(booking.totalAmount)}
                </span>
              </div>

              {payment && (
                <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800">
                  <p className="text-xs text-neutral-400 mb-1">Payment Status</p>
                  <Badge variant={payment.status === "SUCCEEDED" ? "success" : "warning"}>
                    {payment.status}
                  </Badge>
                </div>
              )}

              {canPay && (
                <PaymentButton bookingId={id} amount={booking.totalAmount} />
              )}

              {canCancel && (
                <CancelBookingButton bookingId={id} />
              )}

              {booking.status === "PAID" && (
                <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700 dark:bg-green-950 dark:border-green-800 dark:text-green-400">
                  ✓ Payment completed successfully
                </div>
              )}

              {canRequestCancellation && (
                <CancellationRequestButton
                  bookingId={id}
                  existingReason={cancellationRequest?.reason}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
