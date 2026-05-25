"use client";

import { useRef, useEffect } from "react";
import { ArrowLeft, Phone, Video, Info, Send, Image, Mic } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  type: "user" | "bot";
  text: string;
  buttons?: { label: string; url: string }[];
}

interface PhonePreviewProps {
  username: string;
  profilePic?: string;
  messages: Message[];
  activeTab: "message" | "comment";
  onTabChange: (tab: "message" | "comment") => void;
}

export function PhonePreview({
  username,
  profilePic,
  messages,
  activeTab,
  onTabChange,
}: PhonePreviewProps) {
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="sticky top-8">
      <div
        className="mx-auto bg-black rounded-[40px] p-3 shadow-xl"
        style={{ width: 300, height: 600 }}
      >
        <div className="bg-white rounded-[28px] h-full flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-5 pt-2.5 pb-1 text-[10px] font-semibold">
            <span>9:41</span>
            <div className="flex items-center gap-1">
              <div className="flex gap-0.5">
                <div className="w-1 h-1.5 bg-black rounded-sm" />
                <div className="w-1 h-2 bg-black rounded-sm" />
                <div className="w-1 h-2.5 bg-black rounded-sm" />
                <div className="w-1 h-3 bg-black rounded-sm" />
              </div>
              <svg className="w-3 h-3" viewBox="0 0 12 12"><path fill="black" d="M1 4h10a1 1 0 011 1v2a1 1 0 01-1 1H1a1 1 0 01-1-1V5a1 1 0 011-1z"/><path fill="black" d="M2 5h7v2H2z" opacity="0.7"/></svg>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100">
            <ArrowLeft className="w-4 h-4 text-gray-800" />
            {profilePic ? (
              <img src={profilePic} alt="" className="w-7 h-7 rounded-full object-cover" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-[10px] font-bold">
                {username?.[0]?.toUpperCase() || "U"}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold truncate">{username || "username"}</div>
              <div className="text-[9px] text-gray-400">Active now</div>
            </div>
            <Phone className="w-4 h-4 text-gray-800" />
            <Video className="w-4 h-4 text-gray-800" />
          </div>

          <div className="flex border-b border-gray-100">
            <button
              onClick={() => onTabChange("message")}
              className={cn(
                "flex-1 py-2 text-[10px] font-semibold text-center transition-colors",
                activeTab === "message"
                  ? "text-accent border-b-2 border-accent"
                  : "text-gray-400"
              )}
            >
              Xabar
            </button>
            <button
              onClick={() => onTabChange("comment")}
              className={cn(
                "flex-1 py-2 text-[10px] font-semibold text-center transition-colors",
                activeTab === "comment"
                  ? "text-accent border-b-2 border-accent"
                  : "text-gray-400"
              )}
            >
              Kommentariy
            </button>
          </div>

          <div ref={chatRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5">
            {messages.length === 0 && (
              <div className="text-center text-[10px] text-gray-400 pt-10">
                Xabarlar shu yerda ko'rinadi
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={cn("flex", msg.type === "user" ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-3 py-2",
                    msg.type === "user"
                      ? "bg-accent text-white rounded-br-md"
                      : "bg-gray-100 text-gray-900 rounded-bl-md"
                  )}
                >
                  <p className="text-[11px] leading-relaxed font-body whitespace-pre-wrap">
                    {msg.text}
                  </p>
                  {msg.buttons && msg.buttons.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {msg.buttons.map((btn, bi) => (
                        <div
                          key={bi}
                          className="bg-white/20 backdrop-blur-sm rounded-lg px-2.5 py-1.5 text-[10px] font-medium text-center border border-white/10"
                        >
                          {btn.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 px-3 py-2 border-t border-gray-100">
            <div className="flex-1 bg-gray-100 rounded-full px-3 py-1.5 flex items-center">
              <span className="text-[10px] text-gray-400">Xabar yozing...</span>
            </div>
            <Mic className="w-4 h-4 text-gray-400" />
            <Image className="w-4 h-4 text-gray-400" />
          </div>
        </div>
      </div>
    </div>
  );
}
