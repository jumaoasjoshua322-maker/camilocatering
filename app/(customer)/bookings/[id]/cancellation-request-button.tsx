"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  bookingId: string;
  existingReason?: string;
}

export function CancellationRequestButton({ bookingId, existingReason }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(existingReason || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submitRequest() {
    setLoading(true);
    setError("");

    const res = await fetch(`/api/bookings/${bookingId}/cancellation-request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });

    if (!res.ok) {
      const json = await res.json().catch(() => null);
      setError(json?.error || "Unable to submit request");
      setLoading(false);
      return;
    }

    setLoading(false);
    setOpen(false);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3">
      {existingReason && !open && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300">
          Cancellation request sent. Staff will review it.
        </div>
      )}

      {open && (
        <div className="flex flex-col gap-3 rounded-lg border border-neutral-200 p-3 dark:border-neutral-700">
          <Textarea
            rows={4}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Tell staff why you need to cancel this paid booking..."
          />
          {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={submitRequest}
              disabled={loading}
              className="inline-flex h-10 items-center justify-center rounded-lg bg-amber-600 px-3 text-sm font-medium text-white transition-colors hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Sending..." : "Send Request"}
            </button>
            <button
              onClick={() => setOpen(false)}
              disabled={loading}
              className="inline-flex h-10 items-center justify-center rounded-lg border border-neutral-200 px-3 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-amber-200 px-4 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-50 dark:border-amber-900 dark:text-amber-300 dark:hover:bg-amber-950/40"
        >
          <MessageSquare className="h-4 w-4" />
          {existingReason ? "Update Cancellation Request" : "Request Cancellation"}
        </button>
      )}
    </div>
  );
}
