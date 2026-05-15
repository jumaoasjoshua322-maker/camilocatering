"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

interface Props {
  bookingId: string;
  amount: number;
}

export function PaymentButton({ bookingId, amount }: Props) {
  const router = useRouter();
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

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to initialize payment");
        setLoading(false);
        return;
      }

      router.refresh();
    } catch (err) {
      setError("Payment failed");
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
      <Button
        onClick={handlePayment}
        loading={loading}
        size="lg"
        className="w-full"
      >
        Pay {formatCurrency(amount)}
      </Button>
      <p className="text-xs text-center text-neutral-400">
        Temporary local payment for development
      </p>
    </div>
  );
}
