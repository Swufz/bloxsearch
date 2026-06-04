import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BloxSearch | Roblox market intelligence",
  description: "Find Roblox game ideas backed by live market data.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
