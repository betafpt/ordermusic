import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin", "vietnamese"] });

export const metadata: Metadata = {
  title: "Music Queue System - Phát nhạc nội bộ",
  description: "Hệ thống hàng đợi phát nhạc dành cho văn phòng, buổi tiệc",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={`${inter.className} bg-black text-zinc-100 min-h-screen antialiased selection:bg-rose-500/30 selection:text-rose-200`}>
        {/* Background gradient siêu đẹp */}
        <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-rose-600/20 blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-orange-600/20 blur-[120px]" />
        </div>

        <main className="max-w-6xl mx-auto min-h-screen">
          {children}
        </main>

        <Toaster theme="dark" position="top-center" />
      </body>
    </html>
  );
}
