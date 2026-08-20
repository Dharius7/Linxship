import Link from "next/link";
import { AdminIcon } from "@/components/admin/icons";
import { formatDate } from "@/components/admin/format";
import { EmptyState, PageHeader, StatCard, StatusBadge } from "@/components/admin/server-ui";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Operations overview" };

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const [all, active, delivered, unpaid, unread, recentResult] = await Promise.all([
    supabase.from("shipments").select("id", { count: "exact", head: true }),
    supabase.from("shipments").select("id", { count: "exact", head: true }).eq("is_delivered", false),
    supabase.from("shipments").select("id", { count: "exact", head: true }).eq("is_delivered", true),
    supabase.from("shipments").select("id", { count: "exact", head: true }).eq("payment_status", "unpaid"),
    supabase.from("contact_messages").select("id", { count: "exact", head: true }).eq("is_read", false),
    supabase
      .from("shipments")
      .select("id,tracking_number,recipient_name,destination,current_status,is_delivered,created_at")
      .order("created_at", { ascending: false })
      .limit(7),
  ]);
  const recent = recentResult.data ?? [];

  return (
    <>
      <PageHeader eyebrow="Operations dashboard" title="Good to see you." description="A live view of freight moving through your network.">
        <Link href="/admin/shipments/new" className="admin-button"><AdminIcon name="plus" />Create shipment</Link>
      </PageHeader>
      <section className="admin-stat-grid" aria-label="Shipment overview">
        <StatCard label="All shipments" value={all.count ?? 0} detail="Total consignments" icon="box" tone="forest" />
        <StatCard label="Active" value={active.count ?? 0} detail="Currently in progress" icon="truck" tone="sky" />
        <StatCard label="Delivered" value={delivered.count ?? 0} detail="Successfully completed" icon="check" tone="lime" />
        <StatCard label="Payment due" value={unpaid.count ?? 0} detail="Unpaid consignments" icon="money" tone="rose" />
      </section>

      <div className="admin-dashboard-grid">
        <section className="admin-panel admin-panel--flush admin-recent-panel">
          <div className="admin-panel-heading"><div><span className="admin-eyebrow">Latest activity</span><h2>Recent shipments</h2></div><Link href="/admin/shipments" className="admin-text-link">View all <AdminIcon name="arrow" /></Link></div>
          {recent.length === 0 ? (
            <EmptyState title="No shipments yet" description="Create your first shipment to begin managing delivery progress." href="/admin/shipments/new" action="Create shipment" />
          ) : (
            <div className="admin-record-list">
              {recent.map((shipment) => (
                <Link href={`/admin/shipments/${shipment.id}`} className="admin-record" key={shipment.id}>
                  <span className="admin-record-icon"><AdminIcon name="box" /></span>
                  <span className="admin-record-main"><strong>{shipment.tracking_number}</strong><small>{shipment.recipient_name} · {shipment.destination}</small></span>
                  <StatusBadge status={shipment.current_status} delivered={shipment.is_delivered} />
                  <time>{formatDate(shipment.created_at)}</time>
                  <AdminIcon name="arrow" className="admin-record-arrow" />
                </Link>
              ))}
            </div>
          )}
        </section>
        <aside className="admin-dashboard-side">
          <section className="admin-panel admin-inbox-card">
            <span className="admin-inbox-icon"><AdminIcon name="inbox" /></span>
            <span className="admin-eyebrow">Contact inbox</span>
            <strong>{unread.count ?? 0}</strong>
            <p>unread customer message{unread.count === 1 ? "" : "s"}</p>
            <Link href="/admin/contacts" className="admin-button admin-button--secondary admin-button--wide">Open inbox</Link>
          </section>
          <section className="admin-panel admin-quick-card">
            <h2>Quick actions</h2>
            <Link href="/admin/shipments/new"><span><AdminIcon name="plus" /></span><div><strong>New shipment</strong><small>Add a consignment</small></div><AdminIcon name="arrow" /></Link>
            <Link href="/admin/statuses"><span><AdminIcon name="settings" /></span><div><strong>Status catalog</strong><small>Manage progress labels</small></div><AdminIcon name="arrow" /></Link>
            <Link href="/admin/activity"><span><AdminIcon name="activity" /></span><div><strong>Audit trail</strong><small>Review administrator actions</small></div><AdminIcon name="arrow" /></Link>
          </section>
        </aside>
      </div>
    </>
  );
}

