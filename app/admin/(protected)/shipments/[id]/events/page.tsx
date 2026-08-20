import Link from "next/link";
import { notFound } from "next/navigation";
import { EventForm } from "@/components/admin/event-form";
import { AdminIcon } from "@/components/admin/icons";
import { formatDate, formatMoney } from "@/components/admin/format";
import { ConfirmButton } from "@/components/admin/ui";
import { EmptyState, Notice, PageHeader, StatusBadge } from "@/components/admin/server-ui";
import { deleteTrackingEventAction } from "@/lib/actions/admin";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Tracking events" };
type Search = { success?: string | string[]; error?: string | string[] };
const one = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;

export default async function ShipmentEventsPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Search> }) {
  const { id } = await params;
  const search = await searchParams;
  const supabase = await createClient();
  const [{ data: shipment }, { data: statuses }, { data: events }] = await Promise.all([
    supabase.from("shipments").select("id,tracking_number,recipient_name,current_status,currency").eq("id", id).maybeSingle(),
    supabase.from("shipment_statuses").select("id,name").order("sort_order").order("name"),
    supabase.from("tracking_events").select("id,status,location,event_time,requires_payment,billing_amount,created_at").eq("shipment_id", id).order("event_time", { ascending: false }),
  ]);
  if (!shipment) notFound();
  return (
    <>
      <PageHeader eyebrow={shipment.tracking_number} title="Tracking events" description={`Record chronological milestones for ${shipment.recipient_name}.`}>
        <Link href={`/admin/shipments/${id}`} className="admin-button admin-button--secondary">Back to shipment</Link>
      </PageHeader>
      <Notice success={one(search.success)} error={one(search.error)} />
      <div className="admin-split-grid">
        <section className="admin-panel admin-form-section admin-sticky-panel">
          <div className="admin-section-heading"><span><AdminIcon name="plus" /></span><div><h2>Add milestone</h2><p>The newest event becomes the shipment’s current status.</p></div></div>
          <EventForm shipmentId={id} statuses={statuses ?? []} currency={shipment.currency} />
        </section>
        <section className="admin-panel admin-panel--flush">
          <div className="admin-panel-heading admin-panel-heading--padded"><div><span className="admin-eyebrow">Chronology</span><h2>Event history</h2></div><span className="admin-count-pill">{events?.length ?? 0}</span></div>
          {!events?.length ? (
            <EmptyState icon="clock" title="No events yet" description="Add the first milestone to start this shipment’s tracking timeline." />
          ) : (
            <div className="admin-event-list">
              {events.map((event) => (
                <article className="admin-event-row" key={event.id}>
                  <div className="admin-event-time"><strong>{formatDate(event.event_time)}</strong><small>{formatDate(event.event_time, true).split(",").at(-1)}</small></div>
                  <span className="admin-event-line"><i /></span>
                  <div className="admin-event-content"><StatusBadge status={event.status} /><h3>{event.location}</h3>{event.requires_payment && <p><AdminIcon name="money" />{formatMoney(event.billing_amount, shipment.currency)} customer payment requested</p>}</div>
                  <div className="admin-row-actions"><Link href={`/admin/shipments/${id}/events/${event.id}/edit`} className="admin-button admin-button--secondary admin-button--small">Edit</Link><form action={deleteTrackingEventAction.bind(null, id, event.id)}><ConfirmButton message="Delete this tracking event?">Delete</ConfirmButton></form></div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
