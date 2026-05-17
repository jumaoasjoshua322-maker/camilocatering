"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const POLL_MS = 15_000;

export function BookingAutoRefresh() {
  const router = useRouter();

  useEffect(() => {
    let timer: number | undefined;

    const refresh = () => {
      if (document.visibilityState === "visible") router.refresh();
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

  return null;
}
