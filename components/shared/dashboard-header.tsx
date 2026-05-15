"use client";

import { signOut } from "next-auth/react";
import { LogOut, Menu, User } from "lucide-react";
import { useState } from "react";
import type { UserRole } from "@/types";

interface Props {
  user: { name?: string | null; email?: string | null; role: UserRole };
  onMenuClick: () => void;
}

const roleLabel: Record<UserRole, string> = {
  ADMIN: "Administrator",
  STAFF: "Staff",
  CUSTOMER: "Customer",
};

export function DashboardHeader({ user, onMenuClick }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <header className="h-16 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex items-center justify-between gap-3 px-4 sm:px-6 flex-shrink-0">
      <button
        onClick={onMenuClick}
        className="rounded-lg border border-neutral-200 p-2 text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800 lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-neutral-900 dark:text-white sm:hidden">
          {roleLabel[user.role]}
        </p>
      </div>
      <div className="relative">
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex max-w-[58vw] items-center gap-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 px-2.5 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors sm:max-w-none sm:px-3"
        >
          <div className="h-7 w-7 rounded-full bg-amber-600 flex items-center justify-center">
            <User className="h-3.5 w-3.5 text-white" />
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-sm font-medium text-neutral-900 dark:text-white leading-none">
              {user.name}
            </div>
            <div className="text-xs text-neutral-400 mt-0.5">{roleLabel[user.role]}</div>
          </div>
        </button>

        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <div className="absolute right-0 mt-2 w-52 rounded-2xl border border-neutral-200 bg-white shadow-xl dark:border-neutral-700 dark:bg-neutral-900 z-20 overflow-hidden">
              <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
                <p className="text-xs text-neutral-400 truncate">{user.email}</p>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
              >
                <LogOut className="h-4 w-4" /> Sign Out
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
