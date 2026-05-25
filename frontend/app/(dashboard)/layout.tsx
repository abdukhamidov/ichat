"use client";

import { Sidebar } from "@/components/ui/Sidebar";
import { useFetch } from "@/lib/hooks";
import type { Account } from "@/lib/types";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: accounts } = useFetch<Account[]>("/accounts");

  return (
    <div className="min-h-screen">
      <Sidebar accounts={accounts || []} />
      <main className="ml-[var(--sidebar-width)] min-h-screen">
        <div className="max-w-7xl mx-auto p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
