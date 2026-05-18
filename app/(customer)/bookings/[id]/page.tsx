import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Booking from "@/models/Booking";
import Payment from "@/models/Payment";
import CancellationRequest from "@/models/CancellationRequest";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  CalendarDays,
  MapPin,
  Users,
  Package as PackageIcon,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { PaymentButton } from "./payment-button";
import { CancelBookingButton } from "./cancel-booking-button";
import { CancellationRequestButton } from "./cancellation-request-button";
import { BookingAutoRefresh } from "./booking-auto-refresh";
import { StatusHelp } from "@/components/ui/status-help";
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
  if (booking.customerId.toString() !== session.user.id) redirect("/bookings");

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

  const status = booking.status as BookingStatus;
  const canPay = status === "CONFIRMED" && (!payment || payment.status !== "SUCCEEDED");
  const canCancel = status === "PENDING" || status === "CONFIRMED";
  const canRequestCancellation = status === "PAID";

  return (
    <div className="flex flex-col gap-6">
      <BookingAutoRefresh />

      <div className="flex flex-col gap-3">
        <Link
          href="/bookings"
          className="inline-flex w-fit items-center gap-2 text-sm font-medium text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          All bookings
        </Link>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-mono text-neutral-400 mb-1">
              #{id.slice(-8).toUpperCase()}
            </p>
            <h1 className="font-display text-3xl sm:text-4xl text-neutral-900 dark:text-white leading-tight">
              {pkg.name}
            </h1>
            <p className="text-sm text-neutral-500 mt-2 flex items-center gap-2 flex-wrap">
              <CalendarDays className="h-3.5 w-3.5" />
              {formatDate(booking.eventDate)}
              <span className="text-neutral-300">·</span>
              <MapPin className="h-3.5 w-3.5" />
              {booking.venue}
            </p>
          </div>
          <div className="flex flex-col items-start sm:items-end gap-1.5 shrink-0">
            <Badge variant={statusVariant[status]} className="text-sm px-3 py-1">
              {status}
            </Badge>
            <StatusHelp status={status} audience="customer" className="sm:text-right max-w-[260px]" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Event details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <DetailRow icon={CalendarDays} label="Event date" value={formatDate(booking.eventDate)} />
              <DetailRow icon={MapPin} label="Venue" value={booking.venue} />
              <DetailRow icon={Users} label="Guests" value={`${booking.guestCount}`} />
              {booking.notes && (
                <div className="sm:col-span-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                  <p className="text-xs uppercase tracking-wide text-neutral-500 mb-1">
                    Special requests
                  </p>
                  <p className="text-sm text-neutral-700 dark:text-neutral-300">{booking.notes}</p>
                </div>
              )}
              <p className="sm:col-span-3 text-xs text-neutral-400 pt-1">
                Booked on {formatDate(booking.createdAt)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Package details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-3 mb-4">
                <PackageIcon className="h-5 w-5 text-amber-700 mt-0.5" />
                <div>
                  <p className="font-display text-lg text-neutral-900 dark:text-white">{pkg.name}</p>
                  <Badge variant="neutral" className="mt-1">{pkg.category}</Badge>
                </div>
              </div>
              {pkg.inclusions && pkg.inclusions.length > 0 && (
                <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800">
                  <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
                    Inclusions
                  </p>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {pkg.inclusions.map((inc, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-sm text-neutral-700 dark:text-neutral-300"
                      >
                        <CheckCircle2 className="h-4 w-4 text-amber-700 mt-0.5 shrink-0" />
                        <span>{inc}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Status-aware right column */}
        <div>
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>{rightColumnTitle(status)}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex items-center justify-between py-3 border-b border-neutral-100 dark:border-neutral-800">
                <span className="text-neutral-500">Total</span>
                <span className="text-2xl font-semibold text-amber-800 dark:text-amber-400 tabular-nums">
                  {formatCurrency(booking.totalAmount)}
                </span>
              </div>

              {payment && (
                <div className="-mt-1">
                  <p className="text-xs text-neutral-400 mb-1">Payment</p>
                  <Badge variant={payment.status === "SUCCEEDED" ? "success" : "warning"}>
                    {payment.status}
                  </Badge>
                </div>
              )}

              {/* PENDING — quiet, set expectation */}
              {status === "PENDING" && (
                <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-900 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-200">
                  Staff will confirm this booking within 24 hours. We'll email you when
                  it's ready to pay.
                </div>
              )}

              {/* CONFIRMED — pay action */}
              {canPay && <PaymentButton bookingId={id} amount={booking.totalAmount} />}

              {/* PAID — success block */}
              {status === "PAID" && (
                <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800 dark:bg-green-950 dark:border-green-800 dark:text-green-300">
                  <p className="font-medium flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" /> Payment complete
                  </p>
                  <p className="text-xs mt-1 text-green-700 dark:text-green-400">
                    Your event is locked in. We'll see you on {formatDate(booking.eventDate)}.
                  </p>
                </div>
              )}

              {/* COMPLETED — quiet thanks */}
              {status === "COMPLETED" && (
                <div className="rounded-lg bg-neutral-100 dark:bg-neutral-800/60 px-4 py-3 text-sm text-neutral-700 dark:text-neutral-300">
                  This event is complete. Thanks for booking with us.
                </div>
              )}

              {/* CANCELLED — quiet rebook CTA */}
              {status === "CANCELLED" && (
                <Link
                  href="/services"
                  className="inline-flex h-10 items-center justify-center rounded-lg border border-neutral-200 px-3 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                >
                  Browse packages
                </Link>
              )}

              {canCancel && <CancelBookingButton bookingId={id} />}

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

function rightColumnTitle(status: BookingStatus) {
  switch (status) {
    case "PENDING":
      return "Awaiting confirmation";
    case "CONFIRMED":
      return "Ready to pay";
    case "PAID":
      return "You're all set";
    case "COMPLETED":
      return "Event complete";
    case "CANCELLED":
      return "Booking cancelled";
  }
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CalendarDays;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="h-4 w-4 text-neutral-400 mt-0.5" />
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wide text-neutral-500 mb-0.5">{label}</p>
        <p className="font-medium text-neutral-900 dark:text-white text-sm break-words">
          {value}
        </p>
      </div>
    </div>
  );
}
