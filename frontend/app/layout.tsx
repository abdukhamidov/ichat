import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "InstaChat — Instagram Automation",
  description: "Instagram DM avtomatizatsiya platformasi",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz">
      <body>{children}</body>
    </html>
  );
}
