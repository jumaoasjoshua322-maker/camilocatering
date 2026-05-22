import { Info } from "lucide-react";

interface Props {
  /**
   * "homepage" sits at the very top of the public site as a global notice.
   * "booking" sits inside a card on the booking detail page next to Pay Now.
   */
  variant?: "homepage" | "booking";
}

/**
 * Demo-mode disclaimer. Only renders when payments are not wired
 * (ENABLE_LOCAL_PAYMENT is unset). On a real production deploy with
 * PayMongo configured, this disappears.
 */
export function DemoBanner({ variant = "homepage" }: Props) {
  // Server-side env check. ENABLE_LOCAL_PAYMENT=1 means the local stub is
  // active (dev only). Anything else means payments aren't wired.
  if (process.env.ENABLE_LOCAL_PAYMENT === "1") return null;

  if (variant === "booking") {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
        <p className="font-medium flex items-center gap-1.5">
          <Info className="h-4 w-4" /> Demo mode
        </p>
        <p className="mt-1 text-xs leading-5">
          This is a portfolio project. Online payments aren&apos;t connected, so
          the Pay Now button will return a friendly error. The booking flow,
          admin dashboard, and webhook handler are otherwise complete.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-amber-50 border-b border-amber-200 dark:bg-amber-950/40 dark:border-amber-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-2 flex items-center gap-3 text-xs sm:text-sm text-amber-900 dark:text-amber-200">
        <Info className="h-4 w-4 shrink-0" />
        <p className="leading-5">
          <span className="font-semibold">Portfolio demo.</span>{" "}
          Booking and admin flows are fully functional. Online payments aren&apos;t
          wired — the Pay Now button will show a friendly error.
        </p>
      </div>
    </div>
  );
}
