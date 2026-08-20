import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminIcon } from "@/components/admin/icons";
import { MessageForm } from "@/components/admin/message-form";
import { formatDate } from "@/components/admin/format";
import { ConfirmButton } from "@/components/admin/ui";
import { EmptyState, Notice, PageHeader } from "@/components/admin/server-ui";
import { deleteShipmentMessageAction } from "@/lib/actions/admin";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Shipment messages" };
type Search = { success?: string | string[]; error?: string | string[] };
const one = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;

export default async function ShipmentMessagesPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Search> }) {
  const { id } = await params;
  const search = await searchParams;
  const supabase = await createClient();
  const [{ data: shipment }, { data: messages }] = await Promise.all([
    supabase.from("shipments").select("tracking_number,recipient_name").eq("id", id).maybeSingle(),
    supabase.from("shipment_messages").select("id,message,created_at,updated_at").eq("shipment_id", id).order("created_at", { ascending: false }),
  ]);
  if (!shipment) notFound();
  return (
    <>
      <PageHeader eyebrow={shipment.tracking_number} title="Customer messages" description={`Publish updates that appear on ${shipment.recipient_name}’s tracking result.`}>
        <Link href={`/admin/shipments/${id}`} className="admin-button admin-button--secondary">Back to shipment</Link>
      </PageHeader>
      <Notice success={one(search.success)} error={one(search.error)} />
      <div className="admin-split-grid">
        <section className="admin-panel admin-form-section admin-sticky-panel">
          <div className="admin-section-heading"><span><AdminIcon name="message" /></span><div><h2>Publish an update</h2><p>Keep the wording direct and useful to the customer.</p></div></div>
          <MessageForm shipmentId={id} />
        </section>
        <section className="admin-panel admin-panel--flush">
          <div className="admin-panel-heading admin-panel-heading--padded"><div><span className="admin-eyebrow">Published updates</span><h2>Message history</h2></div><span className="admin-count-pill">{messages?.length ?? 0}</span></div>
          {!messages?.length ? (
            <EmptyState icon="message" title="No messages yet" description="Publish a useful customer update for this shipment." />
          ) : (
            <div className="admin-message-list">
              {messages.map((message) => (
                <article key={message.id}>
                  <span className="admin-message-avatar"><AdminIcon name="message" /></span>
                  <div><p>{message.message}</p><time>Published {formatDate(message.created_at, true)}{message.updated_at !== message.created_at ? " · Edited" : ""}</time></div>
                  <div className="admin-row-actions"><Link href={`/admin/shipments/${id}/messages/${message.id}/edit`} className="admin-button admin-button--secondary admin-button--small">Edit</Link><form action={deleteShipmentMessageAction.bind(null, id, message.id)}><ConfirmButton message="Delete this customer message?">Delete</ConfirmButton></form></div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}

