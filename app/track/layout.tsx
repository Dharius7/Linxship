import type { Metadata } from "next";
import "../public.css";

export const metadata: Metadata = {
  title: "Track a shipment",
  description: "View the latest route and status information for your LinxShip shipment.",
  robots: { index: false, follow: false, nocache: true },
};

export default function TrackingLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
