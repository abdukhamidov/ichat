"use client";

import { useEffect, useMemo, useState } from "react";
import { Instagram, ArrowRight, Zap, Users, BarChart3 } from "lucide-react";
import { api } from "@/lib/api";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
  const demoLoginUrl = useMemo(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl || typeof window === "undefined") return null;
    return `${apiUrl}/auth/demo-login?next=${encodeURIComponent(`${window.location.origin}/dashboard`)}`;
  }, []);

  useEffect(() => {
    if (!demoMode || !demoLoginUrl) return;
    setLoading(true);
    window.location.href = demoLoginUrl;
  }, [demoLoginUrl, demoMode]);

  async function handleConnect() {
    if (demoMode && demoLoginUrl) {
      setLoading(true);
      window.location.href = demoLoginUrl;
      return;
    }

    setLoading(true);
    try {
      const data = await api.get<{ auth_url: string }>("/auth/instagram/connect");
      window.location.href = data.auth_url;
    } catch {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F8FA] flex">
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-[10px] bg-accent flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">InstaChat</span>
          </div>

          <h1 className="text-3xl font-bold mb-2">Xush kelibsiz!</h1>
          <p className="text-gray-500 mb-8 font-body">
            {demoMode
              ? "Demo rejim yoqilgan. Hozir sizni ichkariga avtomatik kiritamiz."
              : "Instagram DM avtomatizatsiya platformasi. Akkauntingizni ulang va boshlang."}
          </p>

          <button onClick={handleConnect} disabled={loading} className="btn-primary w-full text-base py-3">
            <Instagram className="w-5 h-5" />
            {loading ? "Kirilmoqda..." : demoMode ? "Demo rejimda ko'rish" : "Instagram bilan ulash"}
            <ArrowRight className="w-4 h-4 ml-auto" />
          </button>

          <p className="text-xs text-muted mt-4 text-center font-body">
            Meta OAuth orqali xavfsiz ulanish. Biz parolingizni saqlamaymiz.
          </p>
        </div>
      </div>

      <div className="hidden lg:flex flex-1 bg-slate-900 items-center justify-center p-12">
        <div className="max-w-md text-white">
          <h2 className="text-2xl font-bold mb-8">Nima qila olasiz?</h2>
          <div className="space-y-6">
            <Feature
              icon={<Zap className="w-5 h-5" />}
              title="DM Avtomatizatsiya"
              desc="Kalit so'z bo'yicha avtomatik javob. Kommentariyga ham."
            />
            <Feature
              icon={<Users className="w-5 h-5" />}
              title="Mini CRM"
              desc="Kontaktlarni boshqaring: teglar, izohlar, eksport."
            />
            <Feature
              icon={<BarChart3 className="w-5 h-5" />}
              title="Statistika"
              desc="DM yuborildi, havolaga o'tildi, konversiya foizi."
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex gap-4">
      <div className="w-10 h-10 rounded-[10px] bg-white/10 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <h3 className="font-semibold mb-1">{title}</h3>
        <p className="text-sm text-slate-400 font-body">{desc}</p>
      </div>
    </div>
  );
}
