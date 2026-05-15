"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  Package,
  BarChart3,
  Settings,
  ChefHat,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import type { UserRole } from "@/types";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/bookings", label: "Bookings", icon: CalendarDays },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/packages", label: "Packages", icon: Package, adminOnly: true },
  { href: "/dashboard/settings", label: "Settings", icon: Settings, adminOnly: true },
];

interface Props {
  role: UserRole;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function DashboardSidebar({ role, mobileOpen, onMobileClose }: Props) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const visibleItems = navItems.filter((item) => !item.adminOnly || role === "ADMIN");

  const content = (
    <>
      <div className="flex h-16 items-center justify-between px-4 border-b border-neutral-200 dark:border-neutral-800">
        {!collapsed && (
          <Link href="/" className="flex min-w-0 items-center gap-2" onClick={onMobileClose}>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 via-orange-600 to-amber-700 flex items-center justify-center flex-shrink-0 shadow-sm">
              <ChefHat className="h-4 w-4 text-white" />
            </div>
            <span className="truncate text-sm font-extrabold tracking-tight text-neutral-950 dark:text-white">
              Camilo&apos;s <span className="text-amber-600">Catering</span>
            </span>
          </Link>
        )}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="ml-auto hidden rounded-md p-1.5 text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 lg:block"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed
            ? <PanelLeftOpen className="h-4 w-4" />
            : <PanelLeftClose className="h-4 w-4" />}
        </button>
        <button
          onClick={onMobileClose}
          className="ml-auto rounded-md p-1.5 text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 lg:hidden"
          aria-label="Close menu"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <nav className="flex-1 p-3 flex flex-col gap-1">
        {visibleItems.map(({ href, label, icon: Icon, exact }) => {
          const active = exact
            ? pathname === href
            : pathname.startsWith(href) && href !== "/dashboard";
          const isOverview = href === "/dashboard" && pathname === "/dashboard";

          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              onClick={onMobileClose}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active || isOverview
                  ? "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400"
                  : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white"
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {!collapsed && <span className="truncate">{label}</span>}
            </Link>
          );
        })}
      </nav>

      {!collapsed && (
        <div className="p-3 border-t border-neutral-200 dark:border-neutral-800">
          <Link
            href="/"
            target="_blank"
            onClick={onMobileClose}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <span className="h-2 w-2 rounded-full bg-green-500 flex-shrink-0" />
            View Website
          </Link>
        </div>
      )}
    </>
  );

  return (
    <>
      {mobileOpen && (
        <button
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={onMobileClose}
          aria-label="Close menu overlay"
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r border-neutral-200 bg-white transition-transform duration-200 dark:border-neutral-800 dark:bg-neutral-900 lg:static lg:z-auto lg:max-w-none lg:translate-x-0 lg:flex-shrink-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          collapsed ? "lg:w-16" : "lg:w-60"
        )}
      >
        {content}
      </aside>
    </>
  );
}
