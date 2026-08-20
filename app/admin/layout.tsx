import type { Metadata } from "next";
import "@/styles/admin.css";

export const metadata: Metadata = {
  title: { default: "Operations", template: "%s | Lion Gold Admin" },
  description: "Secure shipment operations dashboard for Lion Gold Shipping.",
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <div className="admin-root">{children}</div>;
}

