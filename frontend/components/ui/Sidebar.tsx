"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Zap,
  Users,
  BarChart3,
  Link2,
  Settings,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Account } from "@/lib/types";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/automations", icon: Zap, label: "Avtomatizatsiya" },
  { href: "/contacts", icon: Users, label: "Kontaktlar" },
  { href: "/analytics", icon: BarChart3, label: "Statistika" },
  { href: "/accounts", icon: Link2, label: "Akkauntlar" },
];

interface SidebarProps {
  accounts: Account[];
}

export function Sidebar({ accounts }: SidebarProps) {
  const pathname = usePathname();
  const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[var(--sidebar-width)] bg-slate-900 text-white flex flex-col z-30">
      <div className="p-5 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <div>
          <div className="font-bold text-lg">InstaChat</div>
          {demoMode && (
            <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Demo Mode</div>
          )}
        </div>
      </div>

      <nav className="flex-1 px-3 py-2">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    active
                      ? "bg-white/10 text-white"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  )}
                >
                  <item.icon className="w-[18px] h-[18px]" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="px-3 pb-2">
        <div className="text-xs font-medium text-slate-500 px-3 mb-2 uppercase tracking-wider">
          Akkauntlar
        </div>
        <ul className="space-y-1 mb-3">
          {accounts.map((acc) => (
            <li key={acc.id} className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm">
              <div className="relative">
                {acc.profilePic ? (
                  <img
                    src={acc.profilePic}
                    alt={acc.username}
                    className="w-7 h-7 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-xs">
                    {acc.username[0]?.toUpperCase()}
                  </div>
                )}
                <span
                  className={cn(
                    "absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-slate-900",
                    acc.webhookActive ? "bg-green-400" : "bg-red-400"
                  )}
                />
              </div>
              <span className="text-slate-300 truncate">@{acc.username}</span>
            </li>
          ))}
          {accounts.length === 0 && (
            <li className="px-3 py-2 text-xs text-slate-500">Akkaunt ulanmagan</li>
          )}
        </ul>
      </div>

      <div className="border-t border-slate-800 p-3">
        <Link
          href="/accounts"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          <Settings className="w-[18px] h-[18px]" />
          Sozlamalar
        </Link>
      </div>
    </aside>
  );
}
