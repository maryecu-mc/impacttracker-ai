import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import NavAuth from "@/components/NavAuth";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = "https://impacttracker.maryecurry.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Impact Tracker",
    template: "%s | Impact Tracker",
  },
  description:
    "Capture accomplishments, contributions, and business impact. Let AI turn everyday work into language that lands in reviews, updates, and career conversations.",
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "Impact Tracker",
    title: "Impact Tracker",
    description:
      "Capture accomplishments, contributions, and business impact. Let AI turn everyday work into language that lands.",
  },
  twitter: {
    card: "summary",
    title: "Impact Tracker",
    description:
      "Capture accomplishments, contributions, and business impact. Let AI turn everyday work into language that lands.",
  },
  alternates: {
    canonical: SITE_URL,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-50 min-h-screen`}
      >
        <nav className="bg-white border-b border-slate-200 sticky top-0 z-10">
          <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
            <a
              href="/"
              className="flex items-center gap-2 text-slate-900 font-semibold text-base"
            >
              <span className="text-blue-600 text-lg">◆</span>
              Impact Tracker
            </a>
            <div className="flex items-center gap-6">
              <a
                href="/dashboard"
                className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
              >
                My Impact
              </a>
              <a
                href="/tracker"
                className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Capture Impact
              </a>
              <NavAuth />
            </div>
          </div>
        </nav>
        <main className="max-w-5xl mx-auto px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
