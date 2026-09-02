import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "نظام إدارة المنشورات | آمن وموثوق",
  description: "منصة آمنة لإدارة المحتوى مع حماية متقدمة من XSS و SQL Injection",
  keywords: ["إدارة المحتوى", "منشورات", "أمان", "Next.js", "TypeScript", "RTL", "عربي"],
  authors: [{ name: "فريق التطوير" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "نظام إدارة المنشورات",
    description: "منصة آمنة لإدارة المحتوى",
    type: "website",
    locale: "ar_SA",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
