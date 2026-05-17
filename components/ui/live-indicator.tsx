"use client";

import { useEffect, useState } from "react";

interface Props {
  /** When the data was last fetched. */
  since?: Date | number;
  /** Show "Live" pulse next to the timestamp. */
  pulse?: boolean;
}

function formatAgo(seconds: number): string {
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${Math.floor(seconds)}s ago`;
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return `${h}h ago`;
}

export function LiveIndicator({ since, pulse = true }: Props) {
  const [, force] = useState(0);
  useEffect(() => {
    const t = window.setInterval(() => force((n) => n + 1), 5000);
    return () => window.clearInterval(t);
  }, []);

  if (!since) return null;
  const ms = typeof since === "number" ? since : since.getTime();
  const seconds = (Date.now() - ms) / 1000;

  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-neutral-400">
      {pulse && (
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
        </span>
      )}
      Updated {formatAgo(seconds)}
    </span>
  );
}
