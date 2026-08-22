import type { Metadata } from "next";
import "@/styles/admin.css";

export const metadata: Metadata = {
  title: { default: "Operations", template: "%s | LinxShip Admin" },
  description: "Secure shipment operations dashboard for LinxShip.",
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <div className="admin-root">{children}</div>;
}

