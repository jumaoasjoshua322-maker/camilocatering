"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

function CheckoutForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clientKey = searchParams.get("clientKey");
  const bookingId = searchParams.get("bookingId");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const formRef = useRef<HTMLFormElement | null>(null);

  useEffect(() => {
    if (!clientKey || !bookingId) {
      setError("Invalid payment session");
      setLoading(false);
      return;
    }

    let cancelled = false;
    const submitHandler = async (e: Event) => {
      e.preventDefault();
      if (!clientKey) return;
      setLoading(true);

      try {
        const w = window as unknown as { PayMongo?: (key: string) => unknown };
        const sdk = w.PayMongo;
        if (!sdk) {
          setError("Payment provider not ready");
          setLoading(false);
          return;
        }
        const publicKey = process.env.NEXT_PUBLIC_PAYMONGO_PUBLIC_KEY;
        if (!publicKey) {
          setError("Payment configuration error");
          setLoading(false);
          return;
        }
        const paymongo = sdk(publicKey) as {
          elements: (opts: { clientKey: string }) => unknown;
          confirmPayment: (opts: { elements: unknown; redirect: string }) => Promise<{ error?: { message?: string } }>;
        };
        const elements = paymongo.elements({ clientKey });
        const { error: paymentError } = await paymongo.confirmPayment({
          elements,
          redirect: "if_required",
        });

        if (paymentError) {
          setError(paymentError.message || "Payment failed");
          setLoading(false);
        } else {
          router.push(`/bookings/${bookingId}?payment=success`);
        }
      } catch {
        setError("Payment processing failed");
        setLoading(false);
      }
    };

    const script = document.createElement("script");
    script.src = "https://js.paymongo.com/v1/paymongo.js";
    script.async = true;
    script.onload = () => {
      if (cancelled) return;
      setLoading(false);
      mountCardElement();
    };
    script.onerror = () => {
      if (cancelled) return;
      setError("Failed to load payment provider");
      setLoading(false);
    };
    document.body.appendChild(script);

    function mountCardElement() {
      const w = window as unknown as { PayMongo?: (key: string) => unknown };
      const sdk = w.PayMongo;
      const publicKey = process.env.NEXT_PUBLIC_PAYMONGO_PUBLIC_KEY;
      if (!sdk || !publicKey || !clientKey) {
        setError("Payment configuration error");
        return;
      }
      const paymongo = sdk(publicKey) as {
        elements: (opts: { clientKey: string }) => {
          create: (kind: string, opts?: unknown) => { mount: (sel: string) => void };
        };
      };
      const elements = paymongo.elements({ clientKey });
      const cardElement = elements.create("card", {
        style: {
          base: {
            fontSize: "16px",
            color: "#0f0f0f",
            "::placeholder": { color: "#a3a3a3" },
          },
        },
      });
      cardElement.mount("#card-element");

      formRef.current?.addEventListener("submit", submitHandler);
    }

    return () => {
      cancelled = true;
      formRef.current?.removeEventListener("submit", submitHandler);
      // Only remove the script if it is still attached. React StrictMode and
      // hot-reload can cause this cleanup to run twice.
      if (script.parentNode === document.body) {
        document.body.removeChild(script);
      }
    };
  }, [clientKey, bookingId, router]);

  if (error) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:border-red-800 dark:text-red-400">
            {error}
          </div>
          <button
            onClick={() => router.push(`/bookings/${bookingId ?? ""}`)}
            className="mt-4 w-full inline-flex items-center justify-center h-10 px-4 text-sm font-medium rounded-lg border border-neutral-200 hover:bg-neutral-50 transition-colors"
          >
            Back to Booking
          </button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Complete Payment</CardTitle>
      </CardHeader>
      <CardContent>
        <form ref={formRef} id="payment-form" className="flex flex-col gap-4">
          <div id="card-element" className="p-4 border border-neutral-200 rounded-lg dark:border-neutral-700" />
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-amber-600" />
            </div>
          ) : (
            <button
              type="submit"
              className="w-full inline-flex items-center justify-center h-11 px-6 font-medium rounded-lg bg-amber-600 text-white hover:bg-amber-700 transition-colors"
            >
              Pay Now
            </button>
          )}
        </form>
        <p className="text-xs text-center text-neutral-400 mt-4">
          Your payment is secured by PayMongo
        </p>
      </CardContent>
    </Card>
  );
}

export default function CheckoutPage() {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center p-4">
      <Suspense fallback={
        <Card className="max-w-md mx-auto">
          <CardContent className="py-16 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
          </CardContent>
        </Card>
      }>
        <CheckoutForm />
      </Suspense>
    </div>
  );
}
