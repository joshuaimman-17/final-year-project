import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/features/auth/context/AuthContext";
import { ToastProvider } from "@/components/common/ToastContext";
import { CartProvider } from "@/features/marketplace/context/CartContext";
import BootstrapClient from "@/components/common/BootstrapClient";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('http://localhost:3000'),
  title: "Dr.Plant - Agriculture Command Center",
  description: "Secure, real-time agricultural management and disease diagnosis. Monitor weather, soil moisture, and farm health with ease.",
  keywords: ["agriculture", "agtech", "farming", "diagnosis", "weather", "soil"],
  authors: [{ name: "Dr.Plant Team" }],
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "Dr.Plant - Agriculture Command Center",
    description: "Empowering farmers with real-time data and AI-driven diagnosis.",
    url: "https://dr-plant.app",
    siteName: "Dr.Plant",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Dr.Plant - Agriculture Command Center",
    description: "Empowering farmers with real-time data and AI-driven diagnosis.",
    images: ["/og-image.jpg"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Dr.Plant",
  },
};

export const viewport: Viewport = {
  themeColor: "#2E7D32",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

import SyncObserver from "@/features/auth/components/SyncObserver";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        />
      </head>
      <body className={`${inter.variable} antialiased`}>
        <AuthProvider>
          <SyncObserver />
          <ToastProvider>
            <CartProvider>
              <div className="bg-light min-vh-100">
                {children}
              </div>
            </CartProvider>
          </ToastProvider>
        </AuthProvider>
        <BootstrapClient />
      </body>
    </html>
  );
}
