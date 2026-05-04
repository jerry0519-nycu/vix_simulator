import type { Metadata } from "next";
import { Noto_Sans_TC } from "next/font/google";
import "./globals.css";

const notoSansTC = Noto_Sans_TC({ 
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"]
});

export const metadata: Metadata = {
  title: "VIX ETN Simulation Dashboard",
  description: "Financial dashboard simulating traditional and tail-risk hedged inverse VIX ETNs.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW" className="dark">
      <body className={`${notoSansTC.className} antialiased`}>{children}</body>
    </html>
  );
}
