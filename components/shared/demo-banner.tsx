import { Info } from "lucide-react";

interface Props {
  /**
   * "homepage" sits at the very top of the public site as a global notice.
   * "booking" sits inside a card on the booking detail page next to Pay Now.
   */
  variant?: "homepage" | "booking";
}

/**
 * Portfolio-demo disclaimer.
 *
 * Renders whenever the demo mode is on (`ENABLE_LOCAL_PAYMENT=1`).
 * Copy reflects the real state of the integration: PayMongo IS wired
 * (test mode), and a "Mark as paid (demo)" shortcut is available so a
 * reviewer doesn't need a Filipino e-wallet to walk the full flow.
 *
 * Setting ENABLE_LOCAL_PAYMENT to anything other than "1" hides this
 * banner and the demo shortcut, leaving only the real PayMongo path —
 * which is the right shape for an actual production tenant.
 */
export function DemoBanner({ variant = "homepage" }: Props) {
  if (process.env.ENABLE_LOCAL_PAYMENT !== "1") return null;

  if (variant === "booking") {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
        <p className="font-medium flex items-center gap-1.5">
          <Info className="h-4 w-4" /> Portfolio demo
        </p>
        <p className="mt-1 text-xs leading-5">
          PayMongo is wired in test mode. Use card{" "}
          <span className="font-mono">4343 4343 4343 4345</span> on the
          checkout page, or click <span className="font-medium">Mark as paid (demo)</span>{" "}
          below to skip the wallet step.
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
          Real bookings, admin flow, and PayMongo test-mode checkout — plus a
          one-click &ldquo;Mark as paid&rdquo; shortcut so you don&apos;t need a wallet.
        </p>
      </div>
    </div>
  );
}
