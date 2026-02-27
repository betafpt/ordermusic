import type { Metadata } from "next";
import { Inter, Oswald } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin", "vietnamese"], variable: '--font-inter' });
const oswald = Oswald({ subsets: ["latin", "vietnamese"], variable: '--font-oswald' });

export const metadata: Metadata = {
  title: "G.LAB CASSETTE - Queue Dashboard",
  description: "Retro music queue system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={`${inter.variable} ${oswald.variable} font-sans min-h-screen antialiased selection:bg-brand-pink selection:text-white overflow-x-hidden`}>
        <main className="max-w-[1400px] mx-auto min-h-screen p-4 md:p-8 overflow-x-hidden">
          {/* Top Bar */}
          <header className="brutal-panel p-4 flex flex-wrap items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-blue brutal-border flex items-center justify-center flex-shrink-0">
                <span className="font-oswald text-xl font-bold">N</span>
              </div>
              <h1 className="font-oswald text-2xl font-bold tracking-wide">G.LAB CASSETTE</h1>
            </div>

            <nav className="font-oswald font-bold tracking-widest text-sm flex gap-6">
              <span className="cursor-pointer border-b-4 border-brand-blue pb-1">LIBRARY</span>
              <span className="cursor-pointer text-gray-400 hover:text-white transition-colors">HISTORY</span>
              <span className="cursor-pointer text-gray-400 hover:text-white transition-colors">STATS</span>
            </nav>

            <div className="flex gap-4 w-full md:w-auto mt-4 md:mt-0">
              <div className="relative flex-1 md:w-64">
                <input
                  type="text"
                  placeholder="Search tracks..."
                  className="w-full h-10 px-4 brutal-border bg-white text-black font-medium focus:outline-none"
                />
                <svg className="w-5 h-5 absolute right-3 top-2.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
              <button className="brutal-btn-pink px-6 h-10 font-oswald text-lg">LOGIN</button>
            </div>
          </header>

          {children}

          {/* Footer Tagline */}
          <footer className="mt-8 pt-6 border-t-4 border-brand-panel flex flex-col md:flex-row items-center justify-between gap-4 text-gray-500 font-oswald tracking-widest uppercase text-sm">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand-pink animate-pulse"></span>
              SYSTEM ONLINE
            </div>
            <div className="flex items-center gap-2 brutal-panel px-4 py-2 text-white border-2 border-black">
              <span>CODE BY</span>
              <span className="text-brand-blue font-black">GIANG NGUYEN</span>
            </div>
            <div>© {new Date().getFullYear()} G.LAB STUDIO</div>
          </footer>
        </main>

        <Toaster theme="dark" position="bottom-right" toastOptions={{ className: 'brutal-panel border-4! border-black! rounded-none!' }} />
      </body>
    </html>
  );
}
