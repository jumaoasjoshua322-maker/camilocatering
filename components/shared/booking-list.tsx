"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarDays, MapPin, Users, ChevronDown, CreditCard, Eye, XCircle, X } from "lucide-react";
import { FilterPillButton } from "@/components/ui/filter-pill";
import { EmptyState } from "@/components/ui/empty-state";
import { LiveIndicator } from "@/components/ui/live-indicator";
import type { BookingStatus } from "@/types";

interface BookingItem {
  _id: string;
  status: BookingStatus;
  eventDate: string;
  guestCount: number;
  venue: string;
  totalAmount: number;
  notes?: string;
  packageId: { name: string; category: string } | null;
  customerId: { name: string; email: string } | null;
  cancellationRequest?: {
    _id: string;
    reason: string;
    status: "OPEN" | "RESOLVED" | "DECLINED";
    createdAt: string;
  } | null;
}

const STATUS_OPTIONS: BookingStatus[] = [
  "PENDING",
  "CONFIRMED",
  "PAID",
  "COMPLETED",
  "CANCELLED",
];

const statusVariant: Record<BookingStatus, "default" | "success" | "warning" | "danger" | "neutral"> = {
  PENDING: "warning",
  CONFIRMED: "default",
  PAID: "success",
  COMPLETED: "success",
  CANCELLED: "danger",
};

const TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  PENDING:   ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PAID", "CANCELLED"],
  PAID:      ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

interface Props {
  role: "vendor" | "customer";
}

export function BookingList({ role }: Props) {
  return (
    <Suspense fallback={<BookingListSkeleton />}>
      <BookingListInner role={role} />
    </Suspense>
  );
}

function BookingListSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-32 rounded-xl bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
      ))}
    </div>
  );
}

function BookingListInner({ role }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const statusParam = searchParams.get("status") || "";
  const packageId = searchParams.get("packageId") || "";

  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [lastRefresh, setLastRefresh] = useState<number | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState("");
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");

  const filteredPackageName =
    packageId && bookings.length > 0
      ? bookings.find((b) => b.packageId)?.packageId?.name ?? null
      : null;

  function setStatus(next: string) {
    const sp = new URLSearchParams(searchParams.toString());
    if (next) sp.set("status", next);
    else sp.delete("status");
    router.replace(`${pathname}?${sp.toString()}`, { scroll: false });
  }

  function clearPackageFilter() {
    const sp = new URLSearchParams(searchParams.toString());
    sp.delete("packageId");
    router.replace(`${pathname}?${sp.toString()}`, { scroll: false });
  }

  const fetchBookings = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    const params = new URLSearchParams();
    if (statusParam) params.set("status", statusParam);
    if (packageId) params.set("packageId", packageId);
    try {
      const res = await fetch(`/api/bookings?${params}`, { cache: "no-store" });
      const json = await res.json();
      if (json.success) {
        setBookings(json.data.bookings);
        setTotal(json.data.total);
        setLastRefresh(Date.now());
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [statusParam, packageId]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  useEffect(() => {
    const POLL_MS = 15_000;
    let timer: number | undefined;

    const tick = () => {
      if (document.visibilityState === "visible") fetchBookings(true);
    };

    const start = () => {
      stop();
      timer = window.setInterval(tick, POLL_MS);
    };

    const stop = () => {
      if (timer !== undefined) {
        window.clearInterval(timer);
        timer = undefined;
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        tick();
        start();
      } else {
        stop();
      }
    };

    if (document.visibilityState === "visible") start();
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [fetchBookings]);

  async function handleStatusChange(bookingId: string, newStatus: BookingStatus) {
    setActionError("");
    const res = await fetch(`/api/bookings/${bookingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      setBookings((prev) =>
        prev.map((b) => b._id === bookingId ? { ...b, status: newStatus } : b)
      );
      return;
    }

    const json = await res.json().catch(() => null);
    setActionError(json?.error || "Unable to update booking");
  }

  async function handleCancel(bookingId: string) {
    setCancelingId(bookingId);
    await handleStatusChange(bookingId, "CANCELLED");
    setCancelingId(null);
  }

  async function handlePayment(bookingId: string) {
    setPayingId(bookingId);
    setPaymentError("");

    try {
      const res = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId }),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        setPaymentError(json.error || "Unable to start payment");
        setPayingId(null);
        return;
      }

      setBookings((prev) =>
        prev.map((b) => b._id === bookingId ? { ...b, status: "PAID" } : b)
      );
      setPayingId(null);
    } catch {
      setPaymentError("Unable to complete payment. Please try again.");
      setPayingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Active package filter pill */}
      {packageId && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
          <span>
            Showing bookings for{" "}
            <span className="font-semibold">{filteredPackageName ?? "this package"}</span>
          </span>
          <button
            onClick={clearPackageFilter}
            className="ml-auto inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs hover:bg-amber-100 dark:hover:bg-amber-900/40"
          >
            <X className="h-3.5 w-3.5" /> Clear
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="-mx-4 sm:mx-0 overflow-x-auto flex-1 min-w-0">
          <div className="flex items-center gap-1 px-4 sm:px-0 min-w-max sm:min-w-0 sm:flex-wrap">
            <FilterPillButton active={statusParam === ""} onClick={() => setStatus("")}>
              All ({total})
            </FilterPillButton>
            {STATUS_OPTIONS.map((s) => (
              <FilterPillButton key={s} active={statusParam === s} onClick={() => setStatus(s)}>
                {s}
              </FilterPillButton>
            ))}
          </div>
        </div>
        {!loading && lastRefresh && <LiveIndicator since={lastRefresh} />}
      </div>

      {/* List */}
      {paymentError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
          {paymentError}
        </div>
      )}

      {actionError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
          {actionError}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 rounded-xl bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No bookings found"
          description={
            statusParam || packageId
              ? "Try clearing the filters above to see more bookings."
              : "Bookings will show up here once customers book a package."
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {bookings.map((booking) => (
            <BookingCard
              key={booking._id}
              booking={booking}
              role={role}
              onStatusChange={handleStatusChange}
              onCancel={handleCancel}
              onPayment={handlePayment}
              paying={payingId === booking._id}
              canceling={cancelingId === booking._id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function BookingCard({
  booking,
  role,
  onStatusChange,
  onCancel,
  onPayment,
  paying,
  canceling,
}: {
  booking: BookingItem;
  role: "vendor" | "customer";
  onStatusChange: (id: string, status: BookingStatus) => void;
  onCancel: (id: string) => void;
  onPayment: (id: string) => void;
  paying: boolean;
  canceling: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const transitions = TRANSITIONS[booking.status];
  const canPay = role === "customer" && booking.status === "CONFIRMED";
  const canCancel = role === "customer" && (booking.status === "PENDING" || booking.status === "CONFIRMED");

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Header row */}
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className="text-xs font-mono text-neutral-400">
                #{booking._id.slice(-8).toUpperCase()}
              </span>
              <Badge variant={statusVariant[booking.status]}>
                {booking.status}
              </Badge>
              {booking.packageId && (
                <Badge variant="neutral">{booking.packageId.category}</Badge>
              )}
              {role === "vendor" && booking.cancellationRequest && (
                <Badge variant="danger">Cancellation Requested</Badge>
              )}
            </div>

            {/* Package name */}
            <p className="font-semibold text-neutral-900 dark:text-white mb-1">
              {booking.packageId?.name || "Package"}
            </p>

            {/* Customer (vendor view) or Vendor (customer view) */}
            {role === "vendor" && booking.customerId && (
              <p className="text-sm text-neutral-500 mb-2">
                {booking.customerId.name} · {booking.customerId.email}
              </p>
            )}

            {/* Details */}
            <div className="flex flex-wrap gap-4 text-sm text-neutral-500">
              <span className="flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5" />
                {formatDate(booking.eventDate)}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                {booking.venue}
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />
                {booking.guestCount} guests
              </span>
            </div>

            {booking.notes && (
              <p className="text-xs text-neutral-400 mt-2 italic">
                &ldquo;{booking.notes}&rdquo;
              </p>
            )}

            {role === "vendor" && booking.cancellationRequest && (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                <p className="font-medium">Customer cancellation request</p>
                <p className="mt-1 text-xs leading-5">{booking.cancellationRequest.reason}</p>
              </div>
            )}
          </div>

          {/* Right side */}
          <div className="flex w-full flex-col gap-3 flex-shrink-0 sm:w-auto sm:items-end">
            <span className="text-lg font-bold text-amber-600">
              {formatCurrency(booking.totalAmount)}
            </span>

            {role === "customer" && (
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                <Link
                  href={`/bookings/${booking._id}`}
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-neutral-200 px-3 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                >
                  <Eye className="h-3.5 w-3.5" />
                  View Details
                </Link>
                {canPay && (
                  <button
                    onClick={() => onPayment(booking._id)}
                    disabled={paying}
                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-amber-600 px-3 text-sm font-medium text-white transition-colors hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <CreditCard className="h-3.5 w-3.5" />
                    {paying ? "Starting..." : "Pay Now"}
                  </button>
                )}
                {canCancel && (
                  confirmCancel ? (
                    <div className="flex w-full gap-2 sm:w-auto">
                      <button
                        onClick={() => {
                          onCancel(booking._id);
                          setConfirmCancel(false);
                        }}
                        disabled={canceling}
                        className="inline-flex h-9 flex-1 items-center justify-center rounded-lg bg-red-600 px-3 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70 sm:flex-none"
                      >
                        {canceling ? "Cancelling..." : "Confirm"}
                      </button>
                      <button
                        onClick={() => setConfirmCancel(false)}
                        className="inline-flex h-9 flex-1 items-center justify-center rounded-lg border border-neutral-200 px-3 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800 sm:flex-none"
                      >
                        Keep
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmCancel(true)}
                      className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-red-200 px-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/40"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      Cancel
                    </button>
                  )
                )}
              </div>
            )}

            {/* Status actions — vendor only */}
            {role === "vendor" && transitions.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setOpen((o) => !o)}
                  className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800 transition-colors"
                >
                  Update Status <ChevronDown className="h-3.5 w-3.5" />
                </button>
                {open && (
                  <div className="absolute right-0 mt-1 w-40 rounded-xl border border-neutral-200 bg-white shadow-lg dark:border-neutral-700 dark:bg-neutral-900 z-10">
                    {transitions.map((s) => (
                      <button
                        key={s}
                        onClick={() => {
                          onStatusChange(booking._id, s);
                          setOpen(false);
                        }}
                        className="flex w-full items-center px-4 py-2.5 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 first:rounded-t-xl last:rounded-b-xl"
                      >
                        <Badge variant={statusVariant[s]} className="text-xs">
                          {s}
                        </Badge>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
