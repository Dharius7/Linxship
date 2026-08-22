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
const title = "LinxShip Logistics & Storage";
const description = "Worldwide freight, secure storage, and clear shipment tracking from pickup to delivery.";

export const metadata: Metadata = {
  metadataBase: baseUrl,
  title: { default: title, template: "%s | LinxShip" },
  description,
  applicationName: "LinxShip",
  keywords: ["LinxShip", "LinxShip Logistics", "LinxShip Logistics & Storage", "freight shipping", "cargo tracking", "secure storage"],
  alternates: { canonical: "/" },
  icons: { icon: "/favicon.png", apple: "/favicon.png" },
  openGraph: {
    type: "website",
    siteName: "LinxShip",
    title,
    description,
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "LinxShip — Cargo moves. Confidence stays." }],
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

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "LinxShip Logistics & Storage",
  alternateName: ["LinxShip", "LinxShip Logistics"],
  url: baseUrl.toString(),
  logo: new URL("/images/Logonew.png", baseUrl).toString(),
  image: new URL("/og.png", baseUrl).toString(),
  description,
  slogan: "Cargo moves. Confidence stays.",
  email: "info@linxshiplogis.com",
  address: {
    "@type": "PostalAddress",
    addressLocality: "New York",
    addressRegion: "NY",
    postalCode: "11226",
    addressCountry: "US",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        {children}
      </body>
    </html>
  );
}
