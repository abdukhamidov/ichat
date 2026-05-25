"use client";

import { useState } from "react";
import {
  Plus,
  Instagram,
  Wifi,
  WifiOff,
  Trash2,
  RefreshCw,
  AlertTriangle,
  Shield,
} from "lucide-react";
import { useFetch } from "@/lib/hooks";
import { api } from "@/lib/api";
import { cn, daysUntil } from "@/lib/utils";
import type { Account } from "@/lib/types";

export default function AccountsPage() {
  const { data: accounts, loading, refetch } = useFetch<Account[]>("/accounts");

  async function handleConnect() {
    try {
      const data = await api.get<{ auth_url: string }>("/auth/instagram/connect");
      window.location.href = data.auth_url;
    } catch {
    }
  }

  async function toggleWebhook(id: string) {
    await api.patch(`/accounts/${id}/webhook`);
    refetch();
  }

  async function deleteAccount(id: string) {
    if (!confirm("Bu akkauntni o'chirmoqchimisiz? Barcha avtomatizatsiyalar ham o'chadi.")) return;
    await api.delete(`/accounts/${id}`);
    refetch();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Akkauntlar</h1>
          <p className="text-sm text-gray-500 font-body mt-1">
            Ulangan Instagram akkauntlaringiz
          </p>
        </div>
        <button onClick={handleConnect} className="btn-primary">
          <Plus className="w-4 h-4" />
          Instagram akkaunt ulash
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gray-200" />
                <div className="space-y-2">
                  <div className="h-4 w-28 bg-gray-200 rounded" />
                  <div className="h-3 w-20 bg-gray-100 rounded" />
                </div>
              </div>
              <div className="h-3 w-full bg-gray-100 rounded mb-4" />
              <div className="flex gap-2">
                <div className="h-9 flex-1 bg-gray-100 rounded-lg" />
                <div className="h-9 w-9 bg-gray-100 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      ) : accounts && accounts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((acc) => (
            <AccountCard
              key={acc.id}
              account={acc}
              onToggleWebhook={() => toggleWebhook(acc.id)}
              onDelete={() => deleteAccount(acc.id)}
            />
          ))}

          <button
            onClick={handleConnect}
            className="card p-5 border-dashed hover:bg-gray-50 transition-colors flex flex-col items-center justify-center min-h-[200px] group"
          >
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3 group-hover:bg-accent-light transition-colors">
              <Plus className="w-6 h-6 text-gray-400 group-hover:text-accent transition-colors" />
            </div>
            <span className="text-sm font-medium text-gray-500 group-hover:text-gray-700">
              Yangi akkaunt ulash
            </span>
          </button>
        </div>
      ) : (
        <div className="card p-12 text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 mx-auto mb-4 flex items-center justify-center">
            <Instagram className="w-10 h-10 text-purple-600" />
          </div>
          <h3 className="font-semibold text-lg mb-2">Instagram akkauntingizni ulang</h3>
          <p className="text-sm text-gray-500 font-body mb-6 max-w-md mx-auto">
            Meta OAuth orqali xavfsiz ulaning. Biz faqat xabarlar va kommentariylarni
            boshqarish uchun ruxsat so'raymiz.
          </p>
          <button onClick={handleConnect} className="btn-primary">
            <Instagram className="w-4 h-4" />
            Instagram bilan ulash
          </button>
        </div>
      )}
    </div>
  );
}

function AccountCard({
  account: acc,
  onToggleWebhook,
  onDelete,
}: {
  account: Account;
  onToggleWebhook: () => void;
  onDelete: () => void;
}) {
  const tokenDays = daysUntil(acc.tokenExpiry);
  const tokenPercent = Math.min(100, Math.round((tokenDays / 60) * 100));
  const tokenDanger = tokenDays < 7;

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {acc.profilePic ? (
            <img src={acc.profilePic} alt="" className="w-12 h-12 rounded-full object-cover" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold">
              {acc.username[0]?.toUpperCase()}
            </div>
          )}
          <div>
            <h3 className="font-semibold">@{acc.username}</h3>
            <p className="text-xs text-gray-500 font-body">
              {acc.followersCount.toLocaleString()} follower
            </p>
          </div>
        </div>
        <span className={cn("badge", acc.webhookActive ? "badge-success" : "badge-gray")}>
          {acc.webhookActive ? "Faol" : "Nofaol"}
        </span>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-xs text-gray-500">Token muddati</span>
          </div>
          <span className={cn("text-xs font-medium", tokenDanger ? "text-danger" : "text-gray-600")}>
            {tokenDays} kun qoldi
          </span>
        </div>
        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              tokenDanger ? "bg-danger" : tokenPercent < 40 ? "bg-warning" : "bg-success"
            )}
            style={{ width: `${tokenPercent}%` }}
          />
        </div>
        {tokenDanger && (
          <div className="flex items-center gap-1 mt-1.5">
            <AlertTriangle className="w-3 h-3 text-danger" />
            <span className="text-[10px] text-danger font-body">Tez orada yangilanishi kerak!</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 text-xs text-gray-500 mb-4 font-body">
        <span>{acc.automationCount} avtomatizatsiya</span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onToggleWebhook}
          className={cn("btn-outline flex-1 text-xs", acc.webhookActive && "border-success text-success")}
        >
          {acc.webhookActive ? (
            <>
              <Wifi className="w-3.5 h-3.5" />
              Webhook faol
            </>
          ) : (
            <>
              <WifiOff className="w-3.5 h-3.5" />
              Webhook yoqish
            </>
          )}
        </button>
        <button onClick={onDelete} className="btn-ghost text-danger p-2.5">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
