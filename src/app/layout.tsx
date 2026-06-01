import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Impact Tracker",
  description:
    "Capture accomplishments, contributions, and business impact. Let AI turn everyday work into language that lands.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-50 min-h-screen`}
      >
        <nav className="bg-slate-700 shadow-md sticky top-0 z-10">
          <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
            <a
              href="/"
              className="flex items-center gap-2.5 text-white font-semibold text-base tracking-tight"
            >
              <span className="text-blue-400 text-lg leading-none">◆</span>
              Impact Tracker
            </a>
            <div className="flex items-center gap-6">
              <a
                href="/dashboard"
                className="text-sm text-slate-300 hover:text-white transition-colors"
              >
                My Impact
              </a>
              <a
                href="/tracker"
                className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-500 transition-colors"
              >
                Capture Impact
              </a>
            </div>
          </div>
        </nav>
        <main className="max-w-5xl mx-auto px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
