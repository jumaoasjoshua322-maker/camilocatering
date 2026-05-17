"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const PILL_BASE =
  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2";

const PILL_ACTIVE =
  "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400";

const PILL_INACTIVE =
  "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800";

interface ButtonPillProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
}

export function FilterPillButton({ active, className, ...props }: ButtonPillProps) {
  return (
    <button
      type="button"
      className={cn(PILL_BASE, active ? PILL_ACTIVE : PILL_INACTIVE, className)}
      {...props}
    />
  );
}

interface LinkPillProps extends React.ComponentProps<typeof Link> {
  active?: boolean;
}

export function FilterPillLink({ active, className, ...props }: LinkPillProps) {
  return (
    <Link
      className={cn(PILL_BASE, active ? PILL_ACTIVE : PILL_INACTIVE, className)}
      {...props}
    />
  );
}
