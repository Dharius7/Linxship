import Link from "next/link";
import { AdminIcon } from "@/components/admin/icons";
import { formatDate } from "@/components/admin/format";
import { ConfirmButton } from "@/components/admin/ui";
import { EmptyState, Notice, PageHeader, Pagination, StatusBadge } from "@/components/admin/server-ui";
import { deleteShipmentAction } from "@/lib/actions/admin";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Shipments" };
const PAGE_SIZE = 20;

type Search = { q?: string | string[]; page?: string | string[]; success?: string | string[]; error?: string | string[] };
const one = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;

export default async function ShipmentsPage({ searchParams }: { searchParams: Promise<Search> }) {
  const search = await searchParams;
  const q = (one(search.q) || "").trim().slice(0, 80);
  const page = Math.max(1, Number.parseInt(one(search.page) || "1", 10) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const supabase = await createClient();
  let request = supabase
    .from("shipments")
    .select("id,tracking_number,sender_name,recipient_name,destination,payment_status,current_status,is_delivered,collection_date,created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);
  if (q) {
    const safe = q.replace(/[%_,().]/g, " ").trim();
    request = request.or(`tracking_number.ilike.%${safe}%,sender_name.ilike.%${safe}%,recipient_name.ilike.%${safe}%,destination.ilike.%${safe}%`);
  }
  const { data: shipments, count, error } = await request;
  const total = count ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageHref = (next: number) => `/admin/shipments?${new URLSearchParams({ ...(q ? { q } : {}), page: String(next) })}`;

  return (
    <>
      <PageHeader eyebrow="Consignment management" title="Shipments" description={`${total} shipment${total === 1 ? "" : "s"} in your operations workspace.`}>
        <Link href="/admin/shipments/new" className="admin-button"><AdminIcon name="plus" />Create shipment</Link>
      </PageHeader>
      <Notice success={one(search.success)} error={one(search.error) || (error ? "Shipments could not be loaded." : undefined)} />
      <section className="admin-panel admin-toolbar-panel">
        <form className="admin-search" role="search">
          <AdminIcon name="search" />
          <input name="q" defaultValue={q} placeholder="Search tracking, sender, recipient or destination" aria-label="Search shipments" />
          <button type="submit" className="admin-button admin-button--small">Search</button>
          {q && <Link href="/admin/shipments" className="admin-button admin-button--secondary admin-button--small">Clear</Link>}
        </form>
      </section>
      <section className="admin-panel admin-panel--flush">
        {!shipments?.length ? (
          <EmptyState icon="search" title={q ? "No matching shipments" : "No shipments yet"} description={q ? "Try another tracking number, name, or destination." : "Create a shipment to start recording delivery progress."} href={q ? "/admin/shipments" : "/admin/shipments/new"} action={q ? "Clear search" : "Create shipment"} />
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table admin-responsive-table">
              <thead><tr><th>Tracking</th><th>Route & customer</th><th>Payment</th><th>Status</th><th>Collection</th><th><span className="sr-only">Actions</span></th></tr></thead>
              <tbody>
                {shipments.map((shipment) => (
                  <tr key={shipment.id}>
                    <td data-label="Tracking"><Link className="admin-tracking-link" href={`/admin/shipments/${shipment.id}`}>{shipment.tracking_number}</Link><small>Created {formatDate(shipment.created_at)}</small></td>
                    <td data-label="Route & customer"><strong>{shipment.sender_name} <span className="admin-route-arrow">→</span> {shipment.recipient_name}</strong><small>{shipment.destination}</small></td>
                    <td data-label="Payment"><StatusBadge status={shipment.payment_status.charAt(0).toUpperCase() + shipment.payment_status.slice(1)} /></td>
                    <td data-label="Status"><StatusBadge status={shipment.current_status} delivered={shipment.is_delivered} /></td>
                    <td data-label="Collection">{formatDate(shipment.collection_date)}</td>
                    <td data-label="Actions"><div className="admin-row-actions"><Link href={`/admin/shipments/${shipment.id}`} className="admin-icon-button" aria-label={`Open ${shipment.tracking_number}`}><AdminIcon name="arrow" /></Link><form action={deleteShipmentAction.bind(null, shipment.id)}><ConfirmButton message={`Delete shipment ${shipment.tracking_number} and all of its events and messages?`}>Delete</ConfirmButton></form></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={Math.min(page, pages)} pages={pages} href={pageHref} />
      </section>
    </>
  );
}

