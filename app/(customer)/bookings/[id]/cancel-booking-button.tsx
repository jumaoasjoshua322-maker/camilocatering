"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { XCircle } from "lucide-react";

interface Props {
  bookingId: string;
}

export function CancelBookingButton({ bookingId }: Props) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCancel() {
    setLoading(true);
    setError("");

    const res = await fetch(`/api/bookings/${bookingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "CANCELLED" }),
    });

    if (!res.ok) {
      const json = await res.json().catch(() => null);
      setError(json?.error || "Unable to cancel booking");
      setLoading(false);
      return;
    }

    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
          {error}
        </div>
      )}

      {confirming ? (
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleCancel}
            disabled={loading}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-red-600 px-3 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Cancelling..." : "Confirm"}
          </button>
          <button
            onClick={() => setConfirming(false)}
            disabled={loading}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-neutral-200 px-3 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-70 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            Keep
          </button>
        </div>
      ) : (
        <button
          onClick={() => setConfirming(true)}
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-red-200 px-4 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/40"
        >
          <XCircle className="h-4 w-4" />
          Cancel Booking
        </button>
      )}
    </div>
  );
}
