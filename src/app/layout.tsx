import type { Metadata, Viewport } from "next";
import { Inter, IBM_Plex_Sans_Arabic } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import AuthProvider from "@/components/auth/AuthProvider";
import Header from "@/components/layout/Header";
import Footer from "@/components/footer/Footer";

/* ── Font Configuration ── */

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

/* ── Site Configuration ── */

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

/* ── Metadata ── */

export const metadata: Metadata = {
  title: {
    default: titleTemplates.ar,
    template: "%s | MAVORA",
  },
  description: descriptionTemplates.ar,
  keywords: [
    // English
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
    "online shopping",
    "deals",
    // Arabic
    "مافورا",
    "سوق إلكتروني",
    "إعلانات",
    "سيارات",
    "عقارات",
    "إلكترونيات",
    "المغرب",
    "شمال إفريقيا",
    // French
    "Maroc",
    "petites annonces",
    "acheter",
    "vendre",
    "voitures",
    "immobilier",
  ],
  authors: [{ name: "MAVORA", url: siteUrl }],
  creator: "MAVORA",
  publisher: "MAVORA",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
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
        alt: "MAVORA — Online Marketplace in Morocco & North Africa",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: titleTemplates.ar,
    description: descriptionTemplates.ar,
    images: ["/og-image.png"],
    creator: "@mavora_ma",
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
  category: "marketplace",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#102A43" },
    { media: "(prefers-color-scheme: dark)", color: "#0a1628" },
  ],
};

/* ── Root Layout Component ── */

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        
        {/* Hreflang Tags for SEO */}
        <link rel="alternate" hrefLang="ar" href={`${siteUrl}/`} />
        <link rel="alternate" hrefLang="fr" href={`${siteUrl}/?lang=fr`} />
        <link rel="alternate" hrefLang="en" href={`${siteUrl}/?lang=en`} />
        <link rel="alternate" hrefLang="x-default" href={`${siteUrl}/`} />
        
        {/* Preconnect to External Resources */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Theme Color Meta */}
        <meta name="theme-color" content="#102A43" />
        <meta name="application-name" content="MAVORA" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="MAVORA" />
        
        {/* MS Tiles */}
        <meta name="msapplication-TileColor" content="#102A43" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
      </head>
      <body
        className={`${inter.variable} ${ibmPlexArabic.variable} font-sans antialiased bg-background text-foreground min-h-screen flex flex-col`}
      >
        <AuthProvider>
          {/* Skip to main content - Accessibility */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:start-4 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
          >
            تخطي إلى المحتوى الرئيسي
          </a>
          
          {/* Site Header */}
          <Header />
          
          {/* Main Content Area */}
          <main id="main-content" className="flex-1">
            {children}
          </main>
          
          {/* Site Footer */}
          <Footer />
        </AuthProvider>
        
        {/* Toast Notifications */}
        <Toaster 
          richColors 
          position="top-center"
          toastOptions={{
            duration: 4000,
            classNames: {
              toast: 'group',
              title: 'font-semibold',
              description: 'text-sm opacity-90',
            },
          }}
        />
      </body>
    </html>
  );
}
