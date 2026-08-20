import type { Metadata, Viewport } from "next";
import "./globals.css";

function siteUrl(): URL {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) {
    try {
      const parsed = new URL(configured);
      if (parsed.protocol === "https:" || parsed.protocol === "http:") return parsed;
    } catch {
      // Fall through to the safe local development URL.
    }
  }
  return new URL("http://localhost:3000");
}

const baseUrl = siteUrl();
const title = "Lion Gold Shipping & Storage";
const description = "Worldwide freight, secure storage, and clear shipment tracking from pickup to delivery.";

export const metadata: Metadata = {
  metadataBase: baseUrl,
  title: { default: title, template: "%s | Lion Gold Shipping" },
  description,
  applicationName: "Lion Gold Shipping",
  icons: { icon: "/favicon.png", apple: "/favicon.png" },
  openGraph: {
    type: "website",
    siteName: "Lion Gold Shipping",
    title,
    description,
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Lion Gold — Cargo moves. Confidence stays." }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/og.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#10231c",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
