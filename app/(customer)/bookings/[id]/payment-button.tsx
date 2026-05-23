"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

interface Props {
  bookingId: string;
  amount: number;
  /**
   * When true (gated by ENABLE_LOCAL_PAYMENT=1 server-side), renders a
   * secondary "Mark as paid (demo)" button beneath the real Pay button.
   * Lets a portfolio reviewer experience the post-paid UI without
   * scanning a real QRPh / GCash QR code.
   */
  demoMode?: boolean;
}

interface CheckoutResponse {
  success: boolean;
  data?: { checkoutUrl?: string; sessionId?: string };
  error?: string;
}

export function PaymentButton({ bookingId, amount, demoMode = false }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
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

  async function handleDemoConfirm() {
    setDemoLoading(true);
    setError("");

    try {
      const res = await fetch("/api/payments/demo-confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId }),
      });

      const data = (await res.json().catch(() => null)) as
        | { success?: boolean; error?: string }
        | null;

      if (!res.ok || !data?.success) {
        setError(data?.error || "Demo payment failed.");
        setDemoLoading(false);
        return;
      }

      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      setDemoLoading(false);
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
        disabled={loading || demoLoading}
        size="lg"
        className="w-full"
      >
        Pay {formatCurrency(amount)}
      </Button>
      <p className="text-xs text-center text-neutral-400">
        Secure payment via PayMongo
      </p>

      {demoMode && (
        <>
          <div className="relative my-1">
            <div className="absolute inset-0 flex items-center" aria-hidden>
              <div className="w-full border-t border-dashed border-neutral-200 dark:border-neutral-800" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white dark:bg-neutral-900 px-2 text-[10px] uppercase tracking-wider text-neutral-400">
                Demo
              </span>
            </div>
          </div>
          <Button
            onClick={handleDemoConfirm}
            loading={demoLoading}
            disabled={loading || demoLoading}
            variant="outline"
            size="lg"
            className="w-full gap-2"
          >
            <Sparkles className="h-4 w-4" />
            Mark as paid (demo)
          </Button>
          <p className="text-xs text-center text-neutral-400">
            Skips PayMongo and flips this booking to PAID. Local dev only.
          </p>
        </>
      )}
    </div>
  );
}
