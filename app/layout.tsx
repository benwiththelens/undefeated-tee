import type { Metadata, Viewport } from "next";
import { Alfa_Slab_One, Geist, Geist_Mono } from "next/font/google";
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

// Poster slab for display type, echoing the shirt's Superclarendon without its web licence.
const displaySlab = Alfa_Slab_One({
  variable: "--font-display-slab",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: process.env.NEXT_PUBLIC_APP_URL
    ? new URL(process.env.NEXT_PUBLIC_APP_URL)
    : undefined,
  title: `${PRODUCT.name} — Pre-order`,
  description: `Heavyweight 100% cotton. One printing — pre-order closes ${PRODUCT.closesLabel}. From ${PRICE_LABEL} shipped, from a single batch.`,
  openGraph: {
    title: `${PRODUCT.name} — Pre-order`,
    description: `Heavyweight 100% cotton. Pre-order closes ${PRODUCT.closesLabel}.`,
    // A purpose-built 1200x630 card (design/scripts/brand_assets.jsx): the front graphic plus four
    // tour rows set large, because link previews are thumbnails and the tour list is the hook.
    images: [
      {
        url: "/og-card.png",
        width: 1200,
        height: 630,
        alt: "USA Undefeated World Tour tee: an eagle over a chrome USA, beside tour dates marked W",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    images: ["/og-card.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#1b1917",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${displaySlab.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-zinc-950 text-zinc-50">
        {children}
      </body>
    </html>
  );
}
