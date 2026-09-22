import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { PRICE_LABEL, PRODUCT } from "@/lib/product";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: process.env.NEXT_PUBLIC_APP_URL
    ? new URL(process.env.NEXT_PUBLIC_APP_URL)
    : undefined,
  title: `${PRODUCT.name} — Pre-Order`,
  description: `Heavyweight 100% cotton. One printing — pre-order closes ${PRODUCT.closesLabel}. ${PRICE_LABEL} shipped from a single batch.`,
  openGraph: {
    title: `${PRODUCT.name} — Pre-Order`,
    description: `Heavyweight 100% cotton. Pre-order closes ${PRODUCT.closesLabel}.`,
    images: ["/mockup-back.jpg"],
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#09090b",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-zinc-950 text-zinc-50">
        {children}
      </body>
    </html>
  );
}
