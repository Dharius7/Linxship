import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminIcon } from "@/components/admin/icons";
import { formatDate, formatMoney } from "@/components/admin/format";
import { ConfirmButton } from "@/components/admin/ui";
import { PageHeader, StatusBadge } from "@/components/admin/server-ui";
import { deleteShipmentAction } from "@/lib/actions/admin";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Shipment details" };

export default async function ShipmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: shipment }, { data: events }, { data: messages }] = await Promise.all([
    supabase.from("shipments").select("*").eq("id", id).maybeSingle(),
    supabase.from("tracking_events").select("id,status,location,event_time,requires_payment,billing_amount").eq("shipment_id", id).order("event_time", { ascending: false }).limit(5),
    supabase.from("shipment_messages").select("id,message,created_at").eq("shipment_id", id).order("created_at", { ascending: false }).limit(3),
  ]);
  if (!shipment) notFound();
  const signed = shipment.cargo_image_path
    ? await supabase.storage.from("shipment-images").createSignedUrl(shipment.cargo_image_path, 600)
    : null;

  return (
    <>
      <PageHeader eyebrow="Shipment record" title={shipment.tracking_number} description={`Created ${formatDate(shipment.created_at, true)} · Updated ${formatDate(shipment.updated_at, true)}`}>
        <Link href={`/admin/shipments/${id}/invoice`} className="admin-button admin-button--secondary"><AdminIcon name="document" />Invoice</Link>
        <Link href={`/admin/shipments/${id}/edit`} className="admin-button">Edit shipment</Link>
      </PageHeader>

      <section className="admin-detail-hero">
        <div className="admin-detail-status"><span className="admin-eyebrow">Current progress</span><StatusBadge status={shipment.current_status} delivered={shipment.is_delivered} /><p>{shipment.office_of_origin} <span>→</span> {shipment.destination}</p></div>
        <div className="admin-detail-facts"><div><small>Service</small><strong>{shipment.service_type}</strong></div><div><small>Collection</small><strong>{formatDate(shipment.collection_date)}</strong></div><div><small>Expected delivery</small><strong>{formatDate(shipment.delivery_date)}</strong></div><div><small>Payment</small><strong>{shipment.payment_status}</strong></div></div>
      </section>

      <div className="admin-detail-grid">
        <div className="admin-form-stack">
          <section className="admin-panel">
            <div className="admin-panel-heading"><div><span className="admin-eyebrow">Route parties</span><h2>Sender & recipient</h2></div></div>
            <div className="admin-party-grid">
              <div><span className="admin-party-icon"><AdminIcon name="user" /></span><small>Sender</small><h3>{shipment.sender_name}</h3><p>{shipment.sender_address}</p>{shipment.sender_phone && <a href={`tel:${shipment.sender_phone}`}>{shipment.sender_phone}</a>}{shipment.sender_email && <a href={`mailto:${shipment.sender_email}`}>{shipment.sender_email}</a>}</div>
              <div><span className="admin-party-icon"><AdminIcon name="box" /></span><small>Recipient</small><h3>{shipment.recipient_name}</h3><p>{shipment.recipient_address}</p>{shipment.recipient_phone && <a href={`tel:${shipment.recipient_phone}`}>{shipment.recipient_phone}</a>}{shipment.recipient_email && <a href={`mailto:${shipment.recipient_email}`}>{shipment.recipient_email}</a>}</div>
            </div>
          </section>
          <section className="admin-panel">
            <div className="admin-panel-heading"><div><span className="admin-eyebrow">Package</span><h2>Cargo information</h2></div></div>
            <div className="admin-info-grid"><div><small>Description</small><strong>{shipment.package_description}</strong></div><div><small>Quantity</small><strong>{shipment.quantity}</strong></div><div><small>Weight</small><strong>{shipment.weight} {shipment.weight_unit}</strong></div><div><small>Declared value</small><strong>{formatMoney(shipment.package_value, shipment.currency)}</strong></div></div>
            {shipment.shipment_details && <div className="admin-note"><strong>Additional details</strong><p>{shipment.shipment_details}</p></div>}
            {signed?.data?.signedUrl && <div className="admin-cargo-image"><Image src={signed.data.signedUrl} alt={`Cargo for ${shipment.tracking_number}`} width={1100} height={620} sizes="(max-width: 980px) calc(100vw - 48px), 900px" /></div>}
          </section>
          <section className="admin-panel admin-panel--flush">
            <div className="admin-panel-heading admin-panel-heading--padded"><div><span className="admin-eyebrow">Latest milestones</span><h2>Tracking timeline</h2></div><Link href={`/admin/shipments/${id}/events`} className="admin-text-link">Manage events <AdminIcon name="arrow" /></Link></div>
            {!events?.length ? <div className="admin-inline-empty">No tracking events recorded yet.</div> : <div className="admin-timeline admin-timeline--compact">{events.map((event) => <div className="admin-timeline-item" key={event.id}><span className="admin-timeline-dot" /><div><StatusBadge status={event.status} /><strong>{event.location}</strong><time>{formatDate(event.event_time, true)}</time></div>{event.requires_payment && <small>{formatMoney(event.billing_amount, shipment.currency)} due</small>}</div>)}</div>}
          </section>
        </div>
        <aside className="admin-form-stack">
          <section className="admin-panel admin-billing-card">
            <span className="admin-eyebrow">Commercial summary</span><h2>Billing</h2>
            <dl><div><dt>Freight</dt><dd>{formatMoney(shipment.freight_price, shipment.currency)}</dd></div><div><dt>Insurance</dt><dd>{formatMoney(shipment.insurance, shipment.currency)}</dd></div><div><dt>Declared value</dt><dd>{formatMoney(shipment.package_value, shipment.currency)}</dd></div></dl>
            <div className="admin-billing-total"><span>Freight total</span><strong>{formatMoney(shipment.freight_price, shipment.currency)}</strong></div>
            <div className="admin-visibility-row"><span className={shipment.show_billing ? "is-on" : ""} /><p><strong>{shipment.show_billing ? "Visible publicly" : "Hidden publicly"}</strong><small>Billing visibility</small></p></div>
          </section>
          <section className="admin-panel admin-panel--flush">
            <div className="admin-panel-heading admin-panel-heading--padded"><div><span className="admin-eyebrow">Customer updates</span><h2>Messages</h2></div><Link href={`/admin/shipments/${id}/messages`} className="admin-text-link">Manage <AdminIcon name="arrow" /></Link></div>
            {!messages?.length ? <div className="admin-inline-empty">No customer messages yet.</div> : <div className="admin-message-preview">{messages.map((message) => <article key={message.id}><p>{message.message}</p><time>{formatDate(message.created_at, true)}</time></article>)}</div>}
          </section>
          <section className="admin-panel admin-danger-zone"><h2>Danger zone</h2><p>Deleting this shipment also removes its tracking events, customer messages, and cargo image.</p><form action={deleteShipmentAction.bind(null, id)}><ConfirmButton message={`Permanently delete ${shipment.tracking_number}?`} className="admin-button admin-button--danger admin-button--wide">Delete shipment</ConfirmButton></form></section>
        </aside>
      </div>
    </>
  );
}
