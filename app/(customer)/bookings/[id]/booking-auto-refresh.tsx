"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LiveIndicator } from "@/components/ui/live-indicator";

const POLL_MS = 15_000;

/**
 * Polls the route while the tab is visible and renders a small
 * "Updated Xs ago" indicator so users know the page is live.
 */
export function BookingAutoRefresh() {
  const router = useRouter();
  const [lastRefresh, setLastRefresh] = useState<number>(() => Date.now());

  useEffect(() => {
    let timer: number | undefined;

    const refresh = () => {
      if (document.visibilityState === "visible") {
        router.refresh();
        setLastRefresh(Date.now());
      }
    };

    const start = () => {
      stop();
      timer = window.setInterval(refresh, POLL_MS);
    };

    const stop = () => {
      if (timer !== undefined) {
        window.clearInterval(timer);
        timer = undefined;
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        refresh();
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
  }, [router]);

  return (
    <div className="flex justify-end">
      <LiveIndicator since={lastRefresh} />
    </div>
  );
}
