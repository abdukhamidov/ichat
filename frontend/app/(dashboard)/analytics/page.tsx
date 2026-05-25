"use client";

import { useState, useMemo } from "react";
import {
  Zap,
  Send,
  MousePointerClick,
  TrendingUp,
  AlertTriangle,
  ChevronDown,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useFetch } from "@/lib/hooks";
import { cn, formatDate } from "@/lib/utils";
import type { AnalyticsSummary, Account } from "@/lib/types";

type Period = 7 | 30 | 365;

export default function AnalyticsPage() {
  const [days, setDays] = useState<Period>(7);
  const [accountId, setAccountId] = useState<string | null>(null);
  const { data: accounts } = useFetch<Account[]>("/accounts");

  const query = accountId
    ? `/analytics/summary?days=${days}&account_id=${accountId}`
    : `/analytics/summary?days=${days}`;
  const { data: stats, loading } = useFetch<AnalyticsSummary>(query);

  const chartData = useMemo(() => {
    if (!stats?.daily) return [];
    return Object.entries(stats.daily)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({
        date: new Date(date).toLocaleDateString("uz-UZ", { day: "numeric", month: "short" }),
        dms: count,
      }));
  }, [stats?.daily]);

  const [errorsOpen, setErrorsOpen] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Statistika</h1>
          <p className="text-sm text-gray-500 font-body mt-1">Avtomatizatsiya natijalari</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={accountId ?? ""}
            onChange={(e) => setAccountId(e.target.value || null)}
            className="input w-44"
          >
            <option value="">Barcha akkauntlar</option>
            {accounts?.map((acc) => (
              <option key={acc.id} value={acc.id}>
                @{acc.username}
              </option>
            ))}
          </select>
          <div className="flex bg-gray-100 rounded-[10px] p-1">
            {([7, 30, 365] as Period[]).map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                  days === d ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"
                )}
              >
                {d === 7 ? "7 kun" : d === 30 ? "30 kun" : "Hammasi"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={<Zap className="w-5 h-5 text-accent" />}
          value={stats?.triggered ?? 0}
          label="Boshlandi"
          bg="bg-accent-light"
          loading={loading}
        />
        <StatCard
          icon={<Send className="w-5 h-5 text-blue-600" />}
          value={stats?.dmsSent ?? 0}
          label="DM yuborildi"
          bg="bg-blue-50"
          loading={loading}
        />
        <StatCard
          icon={<MousePointerClick className="w-5 h-5 text-green-600" />}
          value={stats?.linksClicked ?? 0}
          label="Havola bosildi"
          bg="bg-green-50"
          loading={loading}
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5 text-amber-600" />}
          value={`${stats?.conversionRate ?? 0}%`}
          label="Konversiya"
          bg="bg-amber-50"
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="card p-5 lg:col-span-2">
          <h2 className="font-semibold mb-4">Kunlik DM yuborilishi</h2>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                <YAxis tick={{ fontSize: 12 }} stroke="#9CA3AF" allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: "#fff",
                    border: "1px solid #E5E7EB",
                    borderRadius: "10px",
                    fontSize: "13px",
                  }}
                />
                <Bar dataKey="dms" fill="#4F46E5" radius={[4, 4, 0, 0]} name="DM soni" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-sm text-gray-400 font-body">
              Ma'lumot yo'q
            </div>
          )}
        </div>

        <div className="card p-5">
          <h2 className="font-semibold mb-4">Akkauntlar</h2>
          {stats?.accounts && stats.accounts.length > 0 ? (
            <div className="space-y-4">
              {stats.accounts.map((acc) => (
                <div key={acc.id} className="flex items-center gap-3">
                  {acc.profilePic ? (
                    <img src={acc.profilePic} alt="" className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold">
                      {acc.username[0]?.toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">@{acc.username}</div>
                    <div className="text-xs text-gray-500 font-body">
                      {acc.triggered} triggered · {acc.dmsSent} DM
                    </div>
                  </div>
                  <span className="text-sm font-semibold">{acc.linksClicked}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-400 font-body text-center py-8">
              Ma'lumot yo'q
            </div>
          )}
        </div>
      </div>

      {stats?.errors && stats.errors.length > 0 && (
        <div className="card">
          <button
            onClick={() => setErrorsOpen(!errorsOpen)}
            className="w-full flex items-center justify-between p-5"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-warning" />
              <span className="font-semibold">Xatoliklar</span>
              <span className="badge-warning">{stats.errors.length}</span>
            </div>
            <ChevronDown
              className={cn("w-4 h-4 text-gray-400 transition-transform", errorsOpen && "rotate-180")}
            />
          </button>
          {errorsOpen && (
            <div className="px-5 pb-5 space-y-2">
              {stats.errors.map((err) => (
                <div key={err.id} className="p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-red-700">
                      {err.contactName || "Noma'lum"}
                    </span>
                    <span className="text-xs text-red-500">{formatDate(err.createdAt)}</span>
                  </div>
                  <p className="text-xs text-red-600 font-body">{err.error}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  value,
  label,
  bg,
  loading,
}: {
  icon: React.ReactNode;
  value: number | string;
  label: string;
  bg: string;
  loading: boolean;
}) {
  return (
    <div className="stat-card">
      <div className={cn("w-10 h-10 rounded-[10px] flex items-center justify-center mb-2", bg)}>
        {icon}
      </div>
      {loading ? (
        <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
      ) : (
        <div className="stat-value">{typeof value === "number" ? value.toLocaleString() : value}</div>
      )}
      <div className="stat-label font-body">{label}</div>
    </div>
  );
}
