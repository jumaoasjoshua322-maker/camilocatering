"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

interface Props {
  bookingId: string;
  amount: number;
}

interface CheckoutResponse {
  success: boolean;
  data?: { checkoutUrl?: string; sessionId?: string };
  error?: string;
}

export function PaymentButton({ bookingId, amount }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handlePayment() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId }),
      });

      const data = (await res.json().catch(() => null)) as CheckoutResponse | null;

      if (!res.ok || !data?.success || !data.data?.checkoutUrl) {
        setError(data?.error || "Failed to start payment. Please try again.");
        setLoading(false);
        return;
      }

      // External redirect — must be a full navigation, not router.push.
      window.location.href = data.data.checkoutUrl;
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700 dark:bg-red-950 dark:border-red-800 dark:text-red-400">
          {error}
        </div>
      )}
      <Button onClick={handlePayment} loading={loading} size="lg" className="w-full">
        Pay {formatCurrency(amount)}
      </Button>
      <p className="text-xs text-center text-neutral-400">
        Secure payment via PayMongo
      </p>
    </div>
  );
}
