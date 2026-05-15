"use client";

import { useState } from "react";
import { DashboardHeader } from "@/components/shared/dashboard-header";
import { DashboardSidebar } from "@/components/shared/dashboard-sidebar";
import type { UserRole } from "@/types";

interface Props {
  children: React.ReactNode;
  user: { name?: string | null; email?: string | null; role: UserRole };
}

export function DashboardShell({ children, user }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-dvh bg-neutral-50 dark:bg-neutral-950 overflow-hidden">
      <DashboardSidebar
        role={user.role}
        mobileOpen={sidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <DashboardHeader user={user} onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
