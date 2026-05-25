"use client";

import Link from "next/link";
import { Zap, Users, BarChart3, Send, TrendingUp, MousePointerClick } from "lucide-react";
import { useFetch } from "@/lib/hooks";
import type { AnalyticsSummary, Automation, Account } from "@/lib/types";

export default function DashboardPage() {
  const { data: stats } = useFetch<AnalyticsSummary>("/analytics/summary?days=30");
  const { data: automations } = useFetch<Automation[]>("/automations");
  const { data: accounts } = useFetch<Account[]>("/accounts");

  const activeCount = automations?.filter((a) => a.isActive).length ?? 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-gray-500 font-body mt-1">Umumiy ko'rinish</p>
        </div>
        <Link href="/automations/create" className="btn-primary">
          <Zap className="w-4 h-4" />
          Yangi avtomatizatsiya
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={<Zap className="w-5 h-5 text-accent" />}
          value={stats?.triggered ?? 0}
          label="Boshlandi"
          bg="bg-accent-light"
        />
        <StatCard
          icon={<Send className="w-5 h-5 text-blue-600" />}
          value={stats?.dmsSent ?? 0}
          label="DM yuborildi"
          bg="bg-blue-50"
        />
        <StatCard
          icon={<MousePointerClick className="w-5 h-5 text-green-600" />}
          value={stats?.linksClicked ?? 0}
          label="Havola bosildi"
          bg="bg-green-50"
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5 text-amber-600" />}
          value={`${stats?.conversionRate ?? 0}%`}
          label="Konversiya"
          bg="bg-amber-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Faol avtomatizatsiyalar</h2>
            <span className="badge-accent">{activeCount}</span>
          </div>
          {automations && automations.length > 0 ? (
            <div className="space-y-3">
              {automations.slice(0, 5).map((a) => (
                <Link
                  key={a.id}
                  href={`/automations`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-accent-light flex items-center justify-center">
                      <Zap className="w-4 h-4 text-accent" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">{a.name}</div>
                      <div className="text-xs text-gray-500">@{a.accountUsername}</div>
                    </div>
                  </div>
                  <div
                    className={`w-2 h-2 rounded-full ${a.isActive ? "bg-green-400" : "bg-gray-300"}`}
                  />
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              text="Hali avtomatizatsiya yo'q"
              action={
                <Link href="/automations/create" className="btn-primary text-sm mt-3">
                  <Zap className="w-4 h-4" />
                  Yaratish
                </Link>
              }
            />
          )}
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Ulangan akkauntlar</h2>
            <span className="badge-accent">{accounts?.length ?? 0}</span>
          </div>
          {accounts && accounts.length > 0 ? (
            <div className="space-y-3">
              {accounts.map((acc) => (
                <div
                  key={acc.id}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {acc.profilePic ? (
                      <img src={acc.profilePic} alt="" className="w-9 h-9 rounded-full object-cover" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold">
                        {acc.username[0]?.toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="text-sm font-medium">@{acc.username}</div>
                      <div className="text-xs text-gray-500">
                        {acc.followersCount.toLocaleString()} follower
                      </div>
                    </div>
                  </div>
                  <span className={`badge ${acc.webhookActive ? "badge-success" : "badge-gray"}`}>
                    {acc.webhookActive ? "Faol" : "Nofaol"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              text="Akkaunt ulanmagan"
              action={
                <Link href="/accounts" className="btn-primary text-sm mt-3">
                  <Users className="w-4 h-4" />
                  Ulash
                </Link>
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  value,
  label,
  bg,
}: {
  icon: React.ReactNode;
  value: number | string;
  label: string;
  bg: string;
}) {
  return (
    <div className="stat-card">
      <div className={`w-10 h-10 rounded-[10px] ${bg} flex items-center justify-center mb-2`}>
        {icon}
      </div>
      <div className="stat-value">{typeof value === "number" ? value.toLocaleString() : value}</div>
      <div className="stat-label font-body">{label}</div>
    </div>
  );
}

function EmptyState({ text, action }: { text: string; action: React.ReactNode }) {
  return (
    <div className="text-center py-8">
      <p className="text-sm text-gray-400 font-body">{text}</p>
      {action}
    </div>
  );
}
