import type { Metadata } from "next";
import { Inter, IBM_Plex_Sans_Arabic } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import AuthProvider from "@/components/auth/AuthProvider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const ibmPlexArabic = IBM_Plex_Sans_Arabic({
  variable: "--font-ibm-plex-arabic",
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["arabic", "latin"],
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://mavora.ma";

const titleTemplates = {
  ar: "مافورا — سوقك الإلكتروني الموثوق في المغرب وشمال إفريقيا",
  fr: "MAVORA — Votre marché en ligne de confiance au Maroc et en Afrique du Nord",
  en: "MAVORA — Your Trusted Online Marketplace in Morocco & North Africa",
};

const descriptionTemplates = {
  ar: "مافورا هي أكبر سوق إلكتروني في المغرب وشمال إفريقيا. اشترِ وبِع السيارات والعقارات والإلكترونيات والأزياء والمزيد. آمن وسريع وموثوق.",
  fr: "MAVORA est le plus grand marché en ligne du Maroc et d'Afrique du Nord. Achetez et vendez des véhicules, immobilier, électronique, mode et plus encore. Sûr, rapide et fiable.",
  en: "MAVORA is the largest online marketplace in Morocco and North Africa. Buy and sell vehicles, real estate, electronics, fashion, and more. Safe, fast, and trusted.",
};

export const metadata: Metadata = {
  title: {
    default: titleTemplates.ar,
    template: "%s | MAVORA",
  },
  description: descriptionTemplates.ar,
  keywords: [
    "MAVORA",
    "marketplace",
    "Morocco",
    "classifieds",
    "buy",
    "sell",
    "vehicles",
    "real estate",
    "electronics",
    "North Africa",
    "MENA",
    "المغرب",
    "سوق إلكتروني",
    "إعلانات",
    "سيارات",
    "عقارات",
  ],
  authors: [{ name: "MAVORA" }],
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: "/",
    languages: {
      "ar-MA": "/",
      "fr-MA": "/?lang=fr",
      "en-US": "/?lang=en",
    },
  },
  openGraph: {
    title: titleTemplates.ar,
    description: descriptionTemplates.ar,
    siteName: "MAVORA",
    type: "website",
    locale: "ar_MA",
    alternateLocale: ["fr_MA", "en_US"],
    url: siteUrl,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "MAVORA — Online Marketplace",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: titleTemplates.ar,
    description: descriptionTemplates.ar,
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
  },
  other: {
    "theme-color": [
      { media: "(prefers-color-scheme: light)", color: "#0f2b46" },
      { media: "(prefers-color-scheme: dark)", color: "#0a1f33" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="alternate" hrefLang="ar" href={`${siteUrl}/`} />
        <link rel="alternate" hrefLang="fr" href={`${siteUrl}/?lang=fr`} />
        <link rel="alternate" hrefLang="en" href={`${siteUrl}/?lang=en`} />
        <link rel="alternate" hrefLang="x-default" href={`${siteUrl}/`} />
        <meta name="theme-color" content="#0f2b46" />
      </head>
      <body
        className={`${inter.variable} ${ibmPlexArabic.variable} antialiased bg-background text-foreground`}
      >
        <AuthProvider>
          <div className="min-h-screen flex flex-col">
            {children}
          </div>
        </AuthProvider>
        <Toaster richColors position={"top-center"} />
      </body>
    </html>
  );
}
