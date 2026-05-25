"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  X,
  Plus,
  MessageSquare,
  MessageCircle,
  Link2,
  Clock,
  Bell,
  Zap,
} from "lucide-react";
import { useFetch } from "@/lib/hooks";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { PhonePreview } from "@/components/preview/PhonePreview";
import type { Account, AutomationFormData, Button } from "@/lib/types";

const defaultForm: AutomationFormData = {
  accountId: "",
  name: "",
  triggerType: "dm_keyword",
  keywords: [],
  exactMatch: false,
  checkFollow: false,
  welcomeMsg: "",
  noFollowMsg: "",
  afterFollowMsg: "",
  reminderMsg: "",
  reminderDelay: 30,
  extraMsg: "",
  extraDelay: 60,
  buttons: [],
  commentReplies: [],
  enableReminder: false,
  enableExtra: false,
  enableCommentReply: false,
  triggerDM: true,
  triggerComment: false,
};

export default function CreateAutomationPage() {
  const router = useRouter();
  const { data: accounts } = useFetch<Account[]>("/accounts");
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<AutomationFormData>(defaultForm);
  const [keywordInput, setKeywordInput] = useState("");
  const [commentReplyInput, setCommentReplyInput] = useState("");
  const [previewTab, setPreviewTab] = useState<"message" | "comment">("message");
  const [saving, setSaving] = useState(false);

  function update(partial: Partial<AutomationFormData>) {
    setForm((prev) => ({ ...prev, ...partial }));
  }

  function addKeyword() {
    const kw = keywordInput.trim();
    if (kw && !form.keywords.includes(kw)) {
      update({ keywords: [...form.keywords, kw] });
    }
    setKeywordInput("");
  }

  function removeKeyword(kw: string) {
    update({ keywords: form.keywords.filter((k) => k !== kw) });
  }

  function addButton() {
    if (form.buttons.length < 3) {
      update({ buttons: [...form.buttons, { label: "", url: "" }] });
    }
  }

  function updateButton(index: number, field: keyof Button, value: string) {
    const updated = [...form.buttons];
    updated[index] = { ...updated[index], [field]: value };
    update({ buttons: updated });
  }

  function removeButton(index: number) {
    update({ buttons: form.buttons.filter((_, i) => i !== index) });
  }

  function addCommentReply() {
    const cr = commentReplyInput.trim();
    if (cr) {
      update({ commentReplies: [...form.commentReplies, cr] });
    }
    setCommentReplyInput("");
  }

  function removeCommentReply(index: number) {
    update({ commentReplies: form.commentReplies.filter((_, i) => i !== index) });
  }

  const previewMessages = useMemo(() => {
    const msgs: { type: "user" | "bot"; text: string; buttons?: Button[] }[] = [];

    if (previewTab === "message") {
      if (form.keywords.length > 0) {
        msgs.push({ type: "user", text: form.keywords[0] });
      } else {
        msgs.push({ type: "user", text: "Salom!" });
      }
      if (form.welcomeMsg) {
        msgs.push({
          type: "bot",
          text: form.welcomeMsg,
          buttons: form.buttons.filter((b) => b.label && b.url),
        });
      }
      if (form.enableReminder && form.reminderMsg) {
        msgs.push({ type: "bot", text: `⏰ ${form.reminderMsg}` });
      }
      if (form.enableExtra && form.extraMsg) {
        msgs.push({ type: "bot", text: form.extraMsg });
      }
    } else {
      msgs.push({ type: "user", text: form.keywords[0] || "keyword" });
      if (form.commentReplies.length > 0) {
        msgs.push({ type: "bot", text: `💬 ${form.commentReplies[0]}` });
      }
      if (form.welcomeMsg) {
        msgs.push({ type: "bot", text: `📩 DM: ${form.welcomeMsg}` });
      }
    }

    return msgs;
  }, [form, previewTab]);

  const selectedAccount = accounts?.find((a) => a.id === form.accountId);

  async function handleSave() {
    setSaving(true);
    try {
      let triggerType = "any_dm";
      if (form.triggerDM && form.keywords.length > 0) triggerType = "dm_keyword";
      if (form.triggerComment && !form.triggerDM) triggerType = "comment_keyword";
      if (form.triggerComment && form.triggerDM) triggerType = "dm_keyword";

      await api.post("/automations", {
        accountId: form.accountId,
        name: form.name,
        triggerType,
        keywords: form.keywords,
        exactMatch: form.exactMatch,
        checkFollow: form.checkFollow,
        welcomeMsg: form.welcomeMsg,
        noFollowMsg: form.noFollowMsg || null,
        afterFollowMsg: form.afterFollowMsg || null,
        reminderMsg: form.enableReminder ? form.reminderMsg || null : null,
        reminderDelay: form.enableReminder ? form.reminderDelay : null,
        extraMsg: form.enableExtra ? form.extraMsg || null : null,
        extraDelay: form.enableExtra ? form.extraDelay : null,
        buttons: form.buttons.filter((b) => b.label && b.url),
        commentReplies: form.commentReplies,
      });
      router.push("/automations");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Xatolik yuz berdi");
    } finally {
      setSaving(false);
    }
  }

  const canNext =
    step === 1
      ? form.accountId && form.name
      : step === 2
        ? form.welcomeMsg
        : true;

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.back()} className="btn-ghost">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold">Yangi avtomatizatsiya</h1>
          <p className="text-sm text-gray-500 font-body">Qadam {step} / 3</p>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors",
                s < step
                  ? "bg-accent text-white"
                  : s === step
                    ? "bg-accent text-white"
                    : "bg-gray-200 text-gray-500"
              )}
            >
              {s < step ? <Check className="w-4 h-4" /> : s}
            </div>
            <span
              className={cn(
                "text-sm font-medium hidden sm:block",
                s === step ? "text-gray-900" : "text-gray-400"
              )}
            >
              {s === 1 ? "Trigger" : s === 2 ? "Xabarlar" : "Qo'shimcha"}
            </span>
            {s < 3 && <div className="w-8 h-px bg-gray-300 mx-1" />}
          </div>
        ))}
      </div>

      <div className="flex gap-8">
        <div className="flex-1 min-w-0">
          <div className="card p-6">
            {step === 1 && (
              <Step1
                form={form}
                accounts={accounts ?? []}
                keywordInput={keywordInput}
                onKeywordInputChange={setKeywordInput}
                onAddKeyword={addKeyword}
                onRemoveKeyword={removeKeyword}
                onChange={update}
              />
            )}
            {step === 2 && (
              <Step2
                form={form}
                onChange={update}
                onAddButton={addButton}
                onUpdateButton={updateButton}
                onRemoveButton={removeButton}
              />
            )}
            {step === 3 && (
              <Step3
                form={form}
                onChange={update}
                commentReplyInput={commentReplyInput}
                onCommentReplyInputChange={setCommentReplyInput}
                onAddCommentReply={addCommentReply}
                onRemoveCommentReply={removeCommentReply}
              />
            )}
          </div>

          <div className="flex items-center justify-between mt-6">
            <button
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              disabled={step === 1}
              className="btn-outline"
            >
              <ArrowLeft className="w-4 h-4" />
              Orqaga
            </button>
            {step < 3 ? (
              <button
                onClick={() => setStep((s) => s + 1)}
                disabled={!canNext}
                className="btn-primary"
              >
                Keyingi
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button onClick={handleSave} disabled={saving || !canNext} className="btn-primary">
                <Zap className="w-4 h-4" />
                {saving ? "Saqlanmoqda..." : "Saqlash va boshlash"}
              </button>
            )}
          </div>
        </div>

        <div className="hidden lg:block w-[320px] shrink-0">
          <PhonePreview
            username={selectedAccount?.username || "username"}
            profilePic={selectedAccount?.profilePic || undefined}
            messages={previewMessages}
            activeTab={previewTab}
            onTabChange={setPreviewTab}
          />
        </div>
      </div>
    </div>
  );
}

function Step1({
  form,
  accounts,
  keywordInput,
  onKeywordInputChange,
  onAddKeyword,
  onRemoveKeyword,
  onChange,
}: {
  form: AutomationFormData;
  accounts: Account[];
  keywordInput: string;
  onKeywordInputChange: (v: string) => void;
  onAddKeyword: () => void;
  onRemoveKeyword: (kw: string) => void;
  onChange: (p: Partial<AutomationFormData>) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-2">Avtomatizatsiya nomi</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="Masalan: Kurs sotish automation"
          className="input"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Akkaunt</label>
        <select
          value={form.accountId}
          onChange={(e) => onChange({ accountId: e.target.value })}
          className="input"
        >
          <option value="">Akkaunt tanlang</option>
          {accounts.map((acc) => (
            <option key={acc.id} value={acc.id}>
              @{acc.username}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-3">Obunani tekshirish</label>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={form.checkFollow}
            onChange={(e) => onChange({ checkFollow: e.target.checked })}
            className="w-4 h-4 rounded border-gray-300 text-accent focus:ring-accent"
          />
          <span className="text-sm font-body">Foydalanuvchi obuna bo'lganini tekshirish</span>
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium mb-3">Trigger turi</label>
        <div className="space-y-2">
          <label className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-gray-50 cursor-pointer">
            <input
              type="checkbox"
              checked={form.triggerDM}
              onChange={(e) => onChange({ triggerDM: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300 text-accent focus:ring-accent"
            />
            <MessageSquare className="w-4 h-4 text-gray-500" />
            <span className="text-sm">Direct Message</span>
          </label>
          <label className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-gray-50 cursor-pointer">
            <input
              type="checkbox"
              checked={form.triggerComment}
              onChange={(e) => onChange({ triggerComment: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300 text-accent focus:ring-accent"
            />
            <MessageCircle className="w-4 h-4 text-gray-500" />
            <span className="text-sm">Kommentariy</span>
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-3">Kalit so'zlar</label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={keywordInput}
            onChange={(e) => onKeywordInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault();
                onAddKeyword();
              }
            }}
            placeholder="Kalit so'z yozing va Enter bosing"
            className="input flex-1"
          />
          <button onClick={onAddKeyword} className="btn-outline shrink-0">
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {form.keywords.map((kw) => (
            <span
              key={kw}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-accent-light text-accent text-sm"
            >
              {kw}
              <button onClick={() => onRemoveKeyword(kw)} className="hover:text-accent-hover">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
        {form.keywords.length === 0 && (
          <p className="text-xs text-muted mt-1 font-body">
            Bo'sh qoldirsangiz, har qanday xabarga javob beradi
          </p>
        )}
      </div>

      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={form.exactMatch}
          onChange={(e) => onChange({ exactMatch: e.target.checked })}
          className="w-4 h-4 rounded border-gray-300 text-accent focus:ring-accent"
        />
        <span className="text-sm font-body">Aniq moslik (xabar faqat kalit so'zdan iborat bo'lishi kerak)</span>
      </label>
    </div>
  );
}

function Step2({
  form,
  onChange,
  onAddButton,
  onUpdateButton,
  onRemoveButton,
}: {
  form: AutomationFormData;
  onChange: (p: Partial<AutomationFormData>) => void;
  onAddButton: () => void;
  onUpdateButton: (i: number, field: keyof Button, value: string) => void;
  onRemoveButton: (i: number) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-2">
          Salomlashish xabari
          <span className="text-muted ml-2 font-normal">{form.welcomeMsg.length}/500</span>
        </label>
        <textarea
          value={form.welcomeMsg}
          onChange={(e) => {
            if (e.target.value.length <= 500) onChange({ welcomeMsg: e.target.value });
          }}
          placeholder="Salom! Bizning kursimizga qiziqyapsizmi? 🎓"
          className="textarea h-28"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Havola tugmalari</label>
        {form.buttons.map((btn, i) => (
          <div key={i} className="flex items-center gap-2 mb-2">
            <input
              type="text"
              value={btn.label}
              onChange={(e) => onUpdateButton(i, "label", e.target.value)}
              placeholder="Tugma matni"
              className="input flex-1"
            />
            <input
              type="url"
              value={btn.url}
              onChange={(e) => onUpdateButton(i, "url", e.target.value)}
              placeholder="https://..."
              className="input flex-1"
            />
            <button onClick={() => onRemoveButton(i)} className="btn-ghost text-danger">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
        {form.buttons.length < 3 && (
          <button onClick={onAddButton} className="btn-outline text-sm">
            <Link2 className="w-4 h-4" />
            Havola tugmasi qo'shish
          </button>
        )}
      </div>

      {form.checkFollow && (
        <>
          <div>
            <label className="block text-sm font-medium mb-2">
              Obuna bo'lmagan bo'lsa
            </label>
            <textarea
              value={form.noFollowMsg}
              onChange={(e) => onChange({ noFollowMsg: e.target.value })}
              placeholder="Avval bizni kuzatib boring, keyin link yuboramiz! ✨"
              className="textarea h-24"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Obuna bo'lgandan keyin
            </label>
            <textarea
              value={form.afterFollowMsg}
              onChange={(e) => onChange({ afterFollowMsg: e.target.value })}
              placeholder="Rahmat! Mana sizga maxsus link 🎁"
              className="textarea h-24"
            />
          </div>
        </>
      )}
    </div>
  );
}

function Step3({
  form,
  onChange,
  commentReplyInput,
  onCommentReplyInputChange,
  onAddCommentReply,
  onRemoveCommentReply,
}: {
  form: AutomationFormData;
  onChange: (p: Partial<AutomationFormData>) => void;
  commentReplyInput: string;
  onCommentReplyInputChange: (v: string) => void;
  onAddCommentReply: () => void;
  onRemoveCommentReply: (i: number) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="p-4 rounded-lg border border-border">
        <label className="flex items-center justify-between cursor-pointer mb-3">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium">Kommentarlarga avtojawob</span>
          </div>
          <button
            onClick={() => onChange({ enableCommentReply: !form.enableCommentReply })}
            className={cn(
              "relative w-10 h-5 rounded-full transition-colors",
              form.enableCommentReply ? "bg-accent" : "bg-gray-300"
            )}
          >
            <span
              className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all"
              style={{ left: form.enableCommentReply ? "22px" : "2px" }}
            />
          </button>
        </label>
        {form.enableCommentReply && (
          <div>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={commentReplyInput}
                onChange={(e) => onCommentReplyInputChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    onAddCommentReply();
                  }
                }}
                placeholder="Javob matnini yozing"
                className="input flex-1"
              />
              <button onClick={onAddCommentReply} className="btn-outline">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2">
              {form.commentReplies.map((cr, i) => (
                <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <span className="text-sm font-body">{cr}</span>
                  <button onClick={() => onRemoveCommentReply(i)} className="text-gray-400 hover:text-danger">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted mt-2 font-body">
              Har safar tasodifiy biri tanlanadi
            </p>
          </div>
        )}
      </div>

      <div className="p-4 rounded-lg border border-border">
        <label className="flex items-center justify-between cursor-pointer mb-3">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium">Havolaga o'tishni eslatish</span>
          </div>
          <button
            onClick={() => onChange({ enableReminder: !form.enableReminder })}
            className={cn(
              "relative w-10 h-5 rounded-full transition-colors",
              form.enableReminder ? "bg-accent" : "bg-gray-300"
            )}
          >
            <span
              className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all"
              style={{ left: form.enableReminder ? "22px" : "2px" }}
            />
          </button>
        </label>
        {form.enableReminder && (
          <div className="space-y-3">
            <textarea
              value={form.reminderMsg}
              onChange={(e) => onChange({ reminderMsg: e.target.value })}
              placeholder="Linkka bosib ko'rdingizmi? 👀"
              className="textarea h-20"
            />
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <input
                type="number"
                value={form.reminderDelay}
                onChange={(e) => onChange({ reminderDelay: parseInt(e.target.value) || 0 })}
                className="input w-24"
                min={1}
              />
              <span className="text-sm text-gray-500">daqiqadan keyin</span>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 rounded-lg border border-border">
        <label className="flex items-center justify-between cursor-pointer mb-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium">Qo'shimcha xabar</span>
          </div>
          <button
            onClick={() => onChange({ enableExtra: !form.enableExtra })}
            className={cn(
              "relative w-10 h-5 rounded-full transition-colors",
              form.enableExtra ? "bg-accent" : "bg-gray-300"
            )}
          >
            <span
              className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all"
              style={{ left: form.enableExtra ? "22px" : "2px" }}
            />
          </button>
        </label>
        {form.enableExtra && (
          <div className="space-y-3">
            <textarea
              value={form.extraMsg}
              onChange={(e) => onChange({ extraMsg: e.target.value })}
              placeholder="Savollaringiz bo'lsa, yozing! 💬"
              className="textarea h-20"
            />
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <input
                type="number"
                value={form.extraDelay}
                onChange={(e) => onChange({ extraDelay: parseInt(e.target.value) || 0 })}
                className="input w-24"
                min={1}
              />
              <span className="text-sm text-gray-500">daqiqadan keyin</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
