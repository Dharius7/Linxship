import Link from "next/link";
import { AdminIcon } from "@/components/admin/icons";

export default function AdminNotFound() {
  return (
    <div className="admin-not-found">
      <span><AdminIcon name="search" /></span>
      <small>404 · Record not found</small>
      <h1>We couldn’t find that.</h1>
      <p>The record may have been removed, or the address may be incomplete.</p>
      <Link href="/admin/shipments" className="admin-button">Return to shipments</Link>
    </div>
  );
}

