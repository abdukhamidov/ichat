import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDate(date: string) {
  return new Intl.DateTimeFormat("uz-UZ", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function formatRelative(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "hozirgina";
  if (minutes < 60) return `${minutes} daqiqa oldin`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} soat oldin`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} kun oldin`;
  return formatDate(date);
}

export function daysUntil(date: string) {
  const diff = new Date(date).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 86400000));
}

export function truncate(str: string, len: number) {
  return str.length > len ? str.slice(0, len) + "..." : str;
}

export const triggerLabels: Record<string, string> = {
  dm_keyword: "DM Kalit so'z",
  any_dm: "Har qanday DM",
  comment_keyword: "Kommentariy",
  story_reply: "Story javob",
};

export const tagColors: Record<string, string> = {
  lead: "bg-blue-100 text-blue-700",
  client: "bg-green-100 text-green-700",
  vip: "bg-purple-100 text-purple-700",
  spam: "bg-red-100 text-red-700",
};
