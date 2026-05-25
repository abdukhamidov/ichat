"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Download,
  X,
  Tag,
  MessageSquare,
  Calendar,
  StickyNote,
  ChevronRight,
} from "lucide-react";
import { useFetch } from "@/lib/hooks";
import { api } from "@/lib/api";
import { cn, formatDate, formatRelative, tagColors } from "@/lib/utils";
import type { Account, Contact, ContactsResponse } from "@/lib/types";

const TAG_OPTIONS = ["lead", "client", "vip", "spam"];

export default function ContactsPage() {
  const { data: accounts } = useFetch<Account[]>("/accounts");
  const [activeAccountId, setActiveAccountId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  const queryParts: string[] = [];
  if (activeAccountId) queryParts.push(`account_id=${activeAccountId}`);
  if (search) queryParts.push(`search=${encodeURIComponent(search)}`);
  if (tagFilter) queryParts.push(`tag=${tagFilter}`);
  const queryStr = queryParts.length > 0 ? `?${queryParts.join("&")}` : "";

  const { data: contactsData, loading, refetch } = useFetch<ContactsResponse>(
    `/contacts${queryStr}`
  );

  const contacts = contactsData?.items ?? [];
  const total = contactsData?.total ?? 0;

  async function handleExport() {
    const url = activeAccountId
      ? `/contacts/export/csv?account_id=${activeAccountId}`
      : "/contacts/export/csv";
    window.open(`${process.env.NEXT_PUBLIC_API_URL}${url}`, "_blank");
  }

  return (
    <div className="flex gap-0">
      <div className={cn("flex-1 min-w-0 transition-all", selectedContact && "mr-[380px]")}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Kontaktlar</h1>
            <p className="text-sm text-gray-500 font-body mt-1">
              {total} ta kontakt
            </p>
          </div>
          <button onClick={handleExport} className="btn-outline">
            <Download className="w-4 h-4" />
            CSV eksport
          </button>
        </div>

        {accounts && accounts.length > 0 && (
          <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
            <button
              onClick={() => setActiveAccountId(null)}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                !activeAccountId ? "bg-accent text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              Hammasi
            </button>
            {accounts.map((acc) => (
              <button
                key={acc.id}
                onClick={() => setActiveAccountId(acc.id)}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                  activeAccountId === acc.id
                    ? "bg-accent text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                {acc.profilePic ? (
                  <img src={acc.profilePic} alt="" className="w-4 h-4 rounded-full" />
                ) : null}
                @{acc.username}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              type="text"
              placeholder="Username yoki ism bo'yicha qidirish..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10"
            />
          </div>
          <div className="flex items-center gap-1">
            {TAG_OPTIONS.map((tag) => (
              <button
                key={tag}
                onClick={() => setTagFilter(tagFilter === tag ? null : tag)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors",
                  tagFilter === tag
                    ? tagColors[tag] || "bg-gray-200"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                )}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <TableSkeleton />
        ) : contacts.length > 0 ? (
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-gray-50/50">
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Foydalanuvchi</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Teglar</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">DM</th>
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Oxirgi aloqa</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {contacts.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => setSelectedContact(c)}
                    className={cn(
                      "border-b border-border last:border-0 hover:bg-gray-50 cursor-pointer transition-colors",
                      selectedContact?.id === c.id && "bg-accent-light"
                    )}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {c.profilePic ? (
                          <img src={c.profilePic} alt="" className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold">
                            {c.username[0]?.toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-medium">@{c.username}</div>
                          {c.fullName && (
                            <div className="text-xs text-gray-500 font-body">{c.fullName}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 flex-wrap">
                        {c.tags.map((tag) => (
                          <span
                            key={tag}
                            className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium capitalize", tagColors[tag] || "bg-gray-100 text-gray-600")}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm">{c.dmCount}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-500 font-body">{formatRelative(c.lastContact)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <ChevronRight className="w-4 h-4 text-gray-300" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="card p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 mx-auto mb-4 flex items-center justify-center">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="font-semibold mb-2">Kontakt topilmadi</h3>
            <p className="text-sm text-gray-500 font-body">
              Avtomatizatsiya ishlagan paytda kontaktlar avtomatik qo'shiladi.
            </p>
          </div>
        )}
      </div>

      {selectedContact && (
        <ContactDetailPanel
          contact={selectedContact}
          onClose={() => setSelectedContact(null)}
          onUpdate={() => {
            refetch();
          }}
        />
      )}
    </div>
  );
}

function ContactDetailPanel({
  contact,
  onClose,
  onUpdate,
}: {
  contact: Contact;
  onClose: () => void;
  onUpdate: () => void;
}) {
  const [tags, setTags] = useState(contact.tags);
  const [notes, setNotes] = useState(contact.notes || "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setTags(contact.tags);
    setNotes(contact.notes || "");
  }, [contact.id, contact.tags, contact.notes]);

  const save = useCallback(
    async (data: { tags?: string[]; notes?: string }) => {
      setSaving(true);
      try {
        await api.patch(`/contacts/${contact.id}`, data);
        onUpdate();
      } catch {
      } finally {
        setSaving(false);
      }
    },
    [contact.id, onUpdate]
  );

  function toggleTag(tag: string) {
    const newTags = tags.includes(tag)
      ? tags.filter((t) => t !== tag)
      : [...tags, tag];
    setTags(newTags);
    save({ tags: newTags });
  }

  return (
    <div className="fixed right-0 top-0 bottom-0 w-[380px] bg-white border-l border-border shadow-lg z-20 animate-slide-in overflow-y-auto">
      <div className="sticky top-0 bg-white border-b border-border px-5 py-4 flex items-center justify-between">
        <h2 className="font-semibold">Kontakt ma'lumoti</h2>
        <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-5 space-y-6">
        <div className="text-center">
          {contact.profilePic ? (
            <img src={contact.profilePic} alt="" className="w-16 h-16 rounded-full object-cover mx-auto mb-3" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center mx-auto mb-3 text-xl font-bold text-gray-400">
              {contact.username[0]?.toUpperCase()}
            </div>
          )}
          <h3 className="font-semibold">@{contact.username}</h3>
          {contact.fullName && <p className="text-sm text-gray-500 font-body">{contact.fullName}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-gray-50 rounded-lg text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <MessageSquare className="w-3.5 h-3.5 text-gray-400" />
            </div>
            <div className="text-lg font-bold">{contact.dmCount}</div>
            <div className="text-[10px] text-gray-500">DM soni</div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Calendar className="w-3.5 h-3.5 text-gray-400" />
            </div>
            <div className="text-sm font-semibold">{formatDate(contact.firstContact)}</div>
            <div className="text-[10px] text-gray-500">Birinchi aloqa</div>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-3">
            <Tag className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium">Teglar</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {TAG_OPTIONS.map((tag) => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-all border",
                  tags.includes(tag)
                    ? `${tagColors[tag]} border-transparent`
                    : "bg-white text-gray-400 border-dashed border-gray-300 hover:border-gray-400"
                )}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-3">
            <StickyNote className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium">Izoh</span>
            {saving && <span className="text-[10px] text-muted">Saqlanmoqda...</span>}
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={() => {
              if (notes !== (contact.notes || "")) {
                save({ notes });
              }
            }}
            placeholder="Izoh yozing..."
            className="textarea h-24"
          />
        </div>

        <div className="p-3 bg-gray-50 rounded-lg flex items-center justify-between">
          <span className="text-sm font-body">Obuna holati</span>
          <span
            className={cn(
              "badge",
              contact.followsUs === true
                ? "badge-success"
                : contact.followsUs === false
                  ? "badge-danger"
                  : "badge-gray"
            )}
          >
            {contact.followsUs === true ? "Obuna" : contact.followsUs === false ? "Obuna emas" : "Noma'lum"}
          </span>
        </div>
      </div>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="card p-4 space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-3 animate-pulse">
          <div className="w-8 h-8 rounded-full bg-gray-200" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-32 bg-gray-200 rounded" />
            <div className="h-3 w-20 bg-gray-100 rounded" />
          </div>
          <div className="h-5 w-12 bg-gray-100 rounded-full" />
          <div className="h-4 w-8 bg-gray-100 rounded" />
        </div>
      ))}
    </div>
  );
}
