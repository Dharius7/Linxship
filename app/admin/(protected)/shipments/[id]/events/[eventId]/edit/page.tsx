import Link from "next/link";
import { notFound } from "next/navigation";
import { EventForm } from "@/components/admin/event-form";
import { PageHeader } from "@/components/admin/server-ui";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Edit tracking event" };

export default async function EditEventPage({ params }: { params: Promise<{ id: string; eventId: string }> }) {
  const { id, eventId } = await params;
  const supabase = await createClient();
  const [{ data: shipment }, { data: event }, { data: statuses }] = await Promise.all([
    supabase.from("shipments").select("tracking_number,currency").eq("id", id).maybeSingle(),
    supabase.from("tracking_events").select("id,status,location,event_time,requires_payment,billing_amount").eq("id", eventId).eq("shipment_id", id).maybeSingle(),
    supabase.from("shipment_statuses").select("id,name").order("sort_order").order("name"),
  ]);
  if (!shipment || !event) notFound();
  return (
    <>
      <PageHeader eyebrow={shipment.tracking_number} title="Edit tracking event" description="Correct the milestone status, place, timing, or billing request.">
        <Link href={`/admin/shipments/${id}/events`} className="admin-button admin-button--secondary">Back to events</Link>
      </PageHeader>
      <section className="admin-panel admin-form-section admin-narrow-panel"><EventForm shipmentId={id} event={event} statuses={statuses ?? []} currency={shipment.currency} /></section>
    </>
  );
}
