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
  title: "Impact Tracker AI",
  description: "Track and refine your professional accomplishments with AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <nav className="border-b border-gray-200 bg-white">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
            <a href="/" className="text-lg font-semibold text-gray-900">
              Impact Tracker AI
            </a>
            <div className="flex gap-4 text-sm">
              <a href="/tracker" className="text-gray-600 hover:text-gray-900">
                Add Impact
              </a>
              <a href="/dashboard" className="text-gray-600 hover:text-gray-900">
                Dashboard
              </a>
            </div>
          </div>
        </nav>
        <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
