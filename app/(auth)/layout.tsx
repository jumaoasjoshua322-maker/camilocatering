import type { Metadata } from "next";
import Link from "next/link";
import { ChefHat } from "lucide-react";

export const metadata: Metadata = { title: "Auth" };

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 flex flex-col">
      <header className="p-6">
        <Link href="/" className="flex w-fit items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 via-orange-600 to-amber-700 shadow-sm">
            <ChefHat className="h-5 w-5 text-white" />
          </div>
          <span className="text-base font-extrabold tracking-tight text-neutral-950 dark:text-white">
            Camilo&apos;s <span className="text-amber-600">Catering</span>
          </span>
        </Link>
      </header>
      <main className="flex-1 flex items-center justify-center p-4">
        {children}
      </main>
    </div>
  );
}
