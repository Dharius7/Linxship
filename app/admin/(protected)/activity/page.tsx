import { formatDate } from "@/components/admin/format";
import { EmptyState, PageHeader, Pagination } from "@/components/admin/server-ui";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Activity log" };
const PAGE_SIZE = 40;
type Search = { page?: string | string[] };
const one = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;

function describe(details: unknown) {
  if (!details || typeof details !== "object" || Array.isArray(details)) return "—";
  const record = details as Record<string, unknown>;
  const preferred = record.summary || record.tracking_number || record.name || record.status;
  if (typeof preferred === "string") return preferred;
  const entries = Object.entries(record).filter(([, value]) => ["string", "number", "boolean"].includes(typeof value)).slice(0, 3);
  return entries.length ? entries.map(([key, value]) => `${key.replaceAll("_", " ")}: ${String(value)}`).join(" · ") : "—";
}

export default async function ActivityPage({ searchParams }: { searchParams: Promise<Search> }) {
  const search = await searchParams;
  const page = Math.max(1, Number.parseInt(one(search.page) || "1", 10) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const supabase = await createClient();
  const { data: logs, count } = await supabase
    .from("activity_logs")
    .select("id,actor_user_id,action,entity_type,entity_id,details,created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);
  const actors = [...new Set((logs ?? []).map((log) => log.actor_user_id).filter((id): id is string => Boolean(id)))];
  const { data: profiles } = actors.length
    ? await supabase.from("admin_profiles").select("user_id,display_name").in("user_id", actors)
    : { data: [] };
  const names = new Map((profiles ?? []).map((profile) => [profile.user_id, profile.display_name]));
  const total = count ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  return (
    <>
      <PageHeader eyebrow="Immutable audit trail" title="Activity log" description="A chronological record of administrator changes across the workspace." />
      <section className="admin-panel admin-panel--flush">
        {!logs?.length ? (
          <EmptyState icon="activity" title="No activity recorded" description="Administrator changes will appear here automatically." />
        ) : (
          <div className="admin-table-wrap"><table className="admin-table admin-responsive-table"><thead><tr><th>Time</th><th>Administrator</th><th>Action</th><th>Record</th><th>Details</th></tr></thead><tbody>{logs.map((log) => <tr key={log.id}><td data-label="Time">{formatDate(log.created_at, true)}</td><td data-label="Administrator"><strong>{log.actor_user_id ? names.get(log.actor_user_id) || "Administrator" : "System"}</strong></td><td data-label="Action"><span className="admin-action-pill">{log.action.replaceAll("_", " ")}</span></td><td data-label="Record"><strong>{log.entity_type.replaceAll("_", " ")}</strong>{log.entity_id && <small>{log.entity_id.slice(0, 8)}</small>}</td><td data-label="Details">{describe(log.details)}</td></tr>)}</tbody></table></div>
        )}
        <Pagination page={Math.min(page, pages)} pages={pages} href={(next) => `/admin/activity?page=${next}`} />
      </section>
    </>
  );
}

