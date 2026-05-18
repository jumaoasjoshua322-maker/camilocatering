"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import { ChefHat, User, LogOut, LayoutDashboard, CalendarDays, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/services", label: "Services" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

interface Props {
  logoUrl?: string;
  brandName?: string;
}

export function Navbar({ logoUrl, brandName = "Camilo's Catering" }: Props) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const dashboardHref =
    session?.user.role === "ADMIN" || session?.user.role === "STAFF"
      ? "/dashboard"
      : "/bookings";

  return (
    <nav className="sticky top-0 z-50 border-b border-neutral-200/80 bg-white/90 backdrop-blur-md dark:border-neutral-800/80 dark:bg-neutral-950/90">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            {logoUrl ? (
              <span className="relative h-9 w-9 overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-800">
                <Image src={logoUrl} alt="" fill sizes="36px" className="object-cover" />
              </span>
            ) : (
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-amber-700 text-white shadow-sm">
                <ChefHat className="h-4 w-4" />
              </span>
            )}
            <span className="hidden sm:inline font-display text-lg font-semibold tracking-tight text-neutral-950 dark:text-white">
              {brandName}
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  pathname === href || pathname.startsWith(href)
                    ? "text-amber-600 bg-amber-50 dark:bg-amber-900/20"
                    : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-neutral-800"
                )}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {session?.user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen((o) => !o)}
                  className="flex items-center gap-2 rounded-xl border border-neutral-200 dark:border-neutral-700 px-3 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                >
                  <div className="h-7 w-7 rounded-full bg-amber-600 flex items-center justify-center">
                    <User className="h-3.5 w-3.5 text-white" />
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-neutral-900 dark:text-white max-w-[100px] truncate">
                    {session.user.name}
                  </span>
                </button>

                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 mt-2 w-52 rounded-2xl border border-neutral-200 bg-white shadow-xl dark:border-neutral-700 dark:bg-neutral-900 z-20 overflow-hidden">
                      <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
                        <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">{session.user.name}</p>
                        <p className="text-xs text-neutral-400 truncate">{session.user.email}</p>
                      </div>
                      <Link
                        href={dashboardHref}
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                      >
                        {session.user.role === "ADMIN" || session.user.role === "STAFF" ? (
                          <>
                            <LayoutDashboard className="h-4 w-4" /> Dashboard
                          </>
                        ) : (
                          <>
                            <CalendarDays className="h-4 w-4" /> My Bookings
                          </>
                        )}
                      </Link>
                      <div className="border-t border-neutral-100 dark:border-neutral-800">
                        <button
                          onClick={() => signOut({ callbackUrl: "/" })}
                          className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                        >
                          <LogOut className="h-4 w-4" /> Sign Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 text-sm font-medium rounded-lg bg-amber-700 text-white hover:bg-amber-800 transition-colors shadow-sm"
                >
                  Book Now
                </Link>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileOpen((o) => !o)}
              className="md:hidden p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-neutral-100 dark:border-neutral-800 py-3 flex flex-col gap-1">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className="px-4 py-2.5 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-lg"
              >
                {label}
              </Link>
            ))}
            {!session?.user && (
              <div className="flex gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800 mt-1">
                <Link href="/login" onClick={() => setMobileOpen(false)} className="flex-1 text-center py-2 text-sm font-medium text-neutral-600 border border-neutral-200 rounded-lg dark:border-neutral-700 dark:text-neutral-400">
                  Sign In
                </Link>
                <Link href="/register" onClick={() => setMobileOpen(false)} className="flex-1 text-center py-2 text-sm font-medium bg-amber-700 text-white rounded-lg hover:bg-amber-800">
                  Book Now
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
