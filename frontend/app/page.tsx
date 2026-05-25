"use client";

import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

    if (demoMode && apiUrl) {
      const next = encodeURIComponent(`${window.location.origin}/dashboard`);
      window.location.href = `${apiUrl}/auth/demo-login?next=${next}`;
      return;
    }

    window.location.href = "/login";
  }, []);
  return null;
}
