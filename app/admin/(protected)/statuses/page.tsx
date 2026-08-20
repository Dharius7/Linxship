import { AdminIcon } from "@/components/admin/icons";
import { StatusForm } from "@/components/admin/status-form";
import { ConfirmButton } from "@/components/admin/ui";
import { EmptyState, Notice, PageHeader } from "@/components/admin/server-ui";
import { deleteStatusAction } from "@/lib/actions/admin";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Status catalog" };
type Search = { success?: string | string[]; error?: string | string[] };
const one = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;

export default async function StatusesPage({ searchParams }: { searchParams: Promise<Search> }) {
  const search = await searchParams;
  const supabase = await createClient();
  const { data: statuses, error } = await supabase
    .from("shipment_statuses")
    .select("id,name,slug,sort_order,is_terminal,description")
    .order("sort_order")
    .order("name");
  const nextSortOrder = statuses?.length ? Math.max(...statuses.map((status) => status.sort_order)) + 10 : 10;
  return (
    <>
      <PageHeader eyebrow="Reusable workflow" title="Status catalog" description="Maintain consistent progress labels for shipments and tracking events." />
      <Notice success={one(search.success)} error={one(search.error) || (error ? "Statuses could not be loaded." : undefined)} />
      <div className="admin-split-grid admin-split-grid--catalog">
        <section className="admin-panel admin-form-section admin-sticky-panel">
          <div className="admin-section-heading"><span><AdminIcon name="plus" /></span><div><h2>Add status</h2><p>Use a concise, customer-friendly milestone name.</p></div></div>
          <StatusForm nextSortOrder={nextSortOrder} />
        </section>
        <section className="admin-panel admin-panel--flush">
          <div className="admin-panel-heading admin-panel-heading--padded"><div><span className="admin-eyebrow">Available options</span><h2>Shipment statuses</h2></div><span className="admin-count-pill">{statuses?.length ?? 0}</span></div>
          {!statuses?.length ? (
            <EmptyState icon="settings" title="No statuses available" description="Add a reusable progress status to get started." />
          ) : (
            <div className="admin-status-list">
              {statuses.map((status) => (
                <article key={status.id}>
                  <span className={`admin-status-order${status.is_terminal ? " is-terminal" : ""}`}>{status.sort_order}</span>
                  <div><h3>{status.name}</h3><p>{status.description || `Slug: ${status.slug}`}</p></div>
                  {status.is_terminal && <span className="admin-terminal-pill"><AdminIcon name="check" />Terminal</span>}
                  <form action={deleteStatusAction.bind(null, status.id)}><ConfirmButton message={`Remove “${status.name}” from the catalog? Existing shipment text will remain.`}>Delete</ConfirmButton></form>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}

