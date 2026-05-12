import type { Metadata, Viewport } from "next";
import "../styles/globals.css";

export const metadata: Metadata = {
  title: "Dr. Plant",
  description: "AI-Powered Plant Diagnosis & Community",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Dr. Plant",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#2e7d32",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

import { AuthProvider } from "../context/auth-context";
import { CartProvider } from "../context/cart-context";
import Navbar from "../components/layout/Navbar";
import SubNavbar from "../components/layout/SubNavbar";
import CartFooter from "../components/layout/CartFooter";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/icons/icon-512x512.png" />
      </head>
      <body suppressHydrationWarning className="bg-gray-50">
        <AuthProvider>
          <CartProvider>
            <Navbar />
            <SubNavbar />
            <div className="pt-[104px] pb-24">
              {children}
            </div>
            <CartFooter />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
