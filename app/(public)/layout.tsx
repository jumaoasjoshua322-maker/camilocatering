import { Navbar } from "@/components/shared/navbar";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-neutral-950">
      <Navbar />
      <main className="flex-1">{children}</main>
      <footer className="border-t border-neutral-200 dark:border-neutral-800 py-8 text-center text-sm text-neutral-500">
        &copy; {new Date().getFullYear()} Camilo&apos;s Catering. All rights reserved.
      </footer>
    </div>
  );
}
