import Link from "next/link";
import { AdminIcon, type AdminIconName } from "./icons";

export function PageHeader({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="admin-page-header">
      <div>
        {eyebrow && <span className="admin-eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {children && <div className="admin-header-actions">{children}</div>}
    </div>
  );
}

export function Notice({ success, error }: { success?: string; error?: string }) {
  const message = error || success;
  if (!message) return null;
  return (
    <div className={`admin-alert admin-alert--${error ? "error" : "success"}`} role={error ? "alert" : "status"}>
      <AdminIcon name={error ? "close" : "check"} />
      <span>{message}</span>
    </div>
  );
}

export function StatusBadge({ status, delivered = false }: { status: string; delivered?: boolean }) {
  const normalized = status.toLowerCase();
  const tone = delivered || normalized.includes("deliver") || normalized === "paid"
    ? "success"
    : normalized.includes("cancel") || normalized.includes("fail") || normalized === "unpaid"
      ? "danger"
      : normalized === "partial"
        ? "warning"
        : normalized.includes("transit") || normalized.includes("route") || normalized === "refunded"
          ? "info"
          : "neutral";
  return <span className={`admin-badge admin-badge--${tone}`}><span />{status}</span>;
}

export function EmptyState({
  icon = "box",
  title,
  description,
  href,
  action,
}: {
  icon?: AdminIconName;
  title: string;
  description: string;
  href?: string;
  action?: string;
}) {
  return (
    <div className="admin-empty">
      <span className="admin-empty-icon"><AdminIcon name={icon} /></span>
      <h2>{title}</h2>
      <p>{description}</p>
      {href && action && <Link href={href} className="admin-button">{action}</Link>}
    </div>
  );
}

export function StatCard({ label, value, detail, icon, tone = "forest" }: {
  label: string;
  value: number | string;
  detail: string;
  icon: AdminIconName;
  tone?: "forest" | "lime" | "sand" | "sky" | "rose";
}) {
  return (
    <article className={`admin-stat admin-stat--${tone}`}>
      <div className="admin-stat-top"><span>{label}</span><span className="admin-stat-icon"><AdminIcon name={icon} /></span></div>
      <strong>{value}</strong>
      <p>{detail}</p>
    </article>
  );
}

export function Pagination({ page, pages, href }: { page: number; pages: number; href: (page: number) => string }) {
  if (pages <= 1) return null;
  return (
    <nav className="admin-pagination" aria-label="Pagination">
      {page > 1 ? <Link href={href(page - 1)}>Previous</Link> : <span aria-disabled="true">Previous</span>}
      <strong>{page} <small>of {pages}</small></strong>
      {page < pages ? <Link href={href(page + 1)}>Next</Link> : <span aria-disabled="true">Next</span>}
    </nav>
  );
}

