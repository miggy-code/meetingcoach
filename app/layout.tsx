import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Throttl · AI Brain",
  description:
    "Meeting intelligence, goals tracker, and pipeline coaching. Powered by Airtable + DeepSeek.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-bg text-text antialiased">
        {/* Global nav */}
        <nav className="sticky top-0 z-50 border-b bg-bg/90 backdrop-blur-sm">
          <div className="mx-auto flex max-w-6xl items-center gap-6 px-6 py-3">
            <Link
              href="/"
              className="text-xs font-semibold uppercase tracking-[0.16em] text-subtle hover:text-foreground transition-colors"
            >
              Throttl
            </Link>
            <div className="flex items-center gap-4 text-sm">
              <Link
                href="/"
                className="text-muted hover:text-foreground transition-colors"
              >
                Meetings
              </Link>
              <Link
                href="/goals"
                className="text-muted hover:text-foreground transition-colors"
              >
                Goals
              </Link>
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
