"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Zap,
  Sparkles,
  Search,
  Plus,
  MoreVertical,
  Trash2,
  Users,
  TrendingUp,
  MessageSquare,
} from "lucide-react";
import { useFetch } from "@/lib/hooks";
import { api } from "@/lib/api";
import { cn, triggerLabels } from "@/lib/utils";
import type { Automation, Account } from "@/lib/types";

export default function AutomationsPage() {
  const { data: automations, loading, refetch } = useFetch<Automation[]>("/automations");
  const { data: accounts } = useFetch<Account[]>("/accounts");
  const [search, setSearch] = useState("");
  const [filterAccount, setFilterAccount] = useState<string | null>(null);

  const filtered = (automations ?? []).filter((a) => {
    if (search && !a.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterAccount && a.accountId !== filterAccount) return false;
    return true;
  });

  async function toggleActive(id: string, isActive: boolean) {
    await api.patch(`/automations/${id}`, { isActive: !isActive });
    refetch();
  }

  async function deleteAutomation(id: string) {
    if (!confirm("Bu avtomatizatsiyani o'chirmoqchimisiz?")) return;
    await api.delete(`/automations/${id}`);
    refetch();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Avtomatizatsiyalar</h1>
          {automations && (
            <span className="badge-accent text-sm">{automations.length}</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Link href="/automations/create" className="btn-secondary">
            <Sparkles className="w-4 h-4" />
            AI bilan yaratish
          </Link>
          <Link href="/automations/create" className="btn-primary">
            <Plus className="w-4 h-4" />
            Yaratish
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            placeholder="Qidirish..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>
        <select
          value={filterAccount ?? ""}
          onChange={(e) => setFilterAccount(e.target.value || null)}
          className="input w-48"
        >
          <option value="">Barcha akkauntlar</option>
          {accounts?.map((acc) => (
            <option key={acc.id} value={acc.id}>
              @{acc.username}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <LoadingSkeleton />
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((auto) => (
            <AutomationCard
              key={auto.id}
              automation={auto}
              onToggle={() => toggleActive(auto.id, auto.isActive)}
              onDelete={() => deleteAutomation(auto.id)}
            />
          ))}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-accent-light mx-auto mb-4 flex items-center justify-center">
            <Zap className="w-8 h-8 text-accent" />
          </div>
          <h3 className="font-semibold mb-2">Hali avtomatizatsiya yo'q</h3>
          <p className="text-sm text-gray-500 font-body mb-4">
            Instagram DM avtomatizatsiyangizni yarating va vaqtingizni tejang.
          </p>
          <Link href="/automations/create" className="btn-primary">
            <Plus className="w-4 h-4" />
            Birinchisini yaratish
          </Link>
        </div>
      )}
    </div>
  );
}

function AutomationCard({
  automation: a,
  onToggle,
  onDelete,
}: {
  automation: Automation;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const convRate =
    a.stats && a.stats.dmsSent > 0
      ? Math.round((a.stats.linksClicked / a.stats.dmsSent) * 100)
      : 0;

  return (
    <div className="card p-5 hover:shadow transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {a.accountProfilePic ? (
            <img src={a.accountProfilePic} alt="" className="w-9 h-9 rounded-full object-cover" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold">
              {a.accountUsername?.[0]?.toUpperCase() ?? "?"}
            </div>
          )}
          <div>
            <h3 className="font-semibold text-sm">{a.name}</h3>
            <p className="text-xs text-gray-500">@{a.accountUsername}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onToggle}
            className={cn(
              "relative w-10 h-5 rounded-full transition-colors",
              a.isActive ? "bg-accent" : "bg-gray-300"
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform",
                a.isActive ? "left-5.5 translate-x-0" : "left-0.5"
              )}
              style={{ left: a.isActive ? "22px" : "2px" }}
            />
          </button>

          <div className="relative">
            <button onClick={() => setMenuOpen(!menuOpen)} className="p-1 hover:bg-gray-100 rounded">
              <MoreVertical className="w-4 h-4 text-gray-400" />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-8 bg-white rounded-lg shadow-lg border border-border py-1 z-20 w-40">
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onDelete();
                    }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-danger hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    O'chirish
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <span className="badge-accent">
          <MessageSquare className="w-3 h-3 mr-1" />
          {triggerLabels[a.triggerType] || a.triggerType}
        </span>
        {a.keywords.length > 0 && (
          <span className="badge-gray truncate max-w-[120px]">{a.keywords[0]}</span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3 pt-4 border-t border-border">
        <div>
          <div className="text-lg font-bold">{a.stats?.triggered ?? 0}</div>
          <div className="text-xs text-gray-500">Boshlandi</div>
        </div>
        <div>
          <div className="text-lg font-bold flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-gray-400" />
            {a.stats?.dmsSent ?? 0}
          </div>
          <div className="text-xs text-gray-500">DM</div>
        </div>
        <div>
          <div className="text-lg font-bold flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-gray-400" />
            {convRate}%
          </div>
          <div className="text-xs text-gray-500">Konversiya</div>
        </div>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="card p-5 animate-pulse">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-full bg-gray-200" />
            <div className="space-y-2">
              <div className="h-4 w-32 bg-gray-200 rounded" />
              <div className="h-3 w-20 bg-gray-100 rounded" />
            </div>
          </div>
          <div className="h-6 w-24 bg-gray-100 rounded-full mb-4" />
          <div className="grid grid-cols-3 gap-3 pt-4 border-t">
            <div className="h-8 bg-gray-100 rounded" />
            <div className="h-8 bg-gray-100 rounded" />
            <div className="h-8 bg-gray-100 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
