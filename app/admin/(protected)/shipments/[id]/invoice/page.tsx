import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDate } from "@/components/admin/format";
import { PrintButton } from "@/components/admin/ui";
import { PageHeader } from "@/components/admin/server-ui";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Shipment invoice" };

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: shipment }, { data: events }] = await Promise.all([
    supabase.from("shipments").select("*").eq("id", id).maybeSingle(),
    supabase.from("tracking_events").select("id,status,location,event_time").eq("shipment_id", id).order("event_time", { ascending: true }),
  ]);
  if (!shipment) notFound();
  const money = (value: number) => {
    const amount = Number(value || 0);
    return new Intl.NumberFormat("en-US", { style: "currency", currency: shipment.currency }).format(amount);
  };
  return (
    <>
      <div className="admin-no-print"><PageHeader eyebrow={shipment.tracking_number} title="Shipment invoice" description="A clean, printable commercial summary."><Link href={`/admin/shipments/${id}`} className="admin-button admin-button--secondary">Back to shipment</Link><PrintButton /></PageHeader></div>
      <article className="admin-invoice">
        <header className="admin-invoice-header"><Image src="/images/logo-dark.png" alt="Lion Gold Shipping" width={289} height={96} /><div><span>Shipment invoice</span><strong>{shipment.tracking_number}</strong><small>Issued {formatDate(shipment.created_at)}</small></div></header>
        <section className="admin-invoice-route"><div><small>Origin</small><strong>{shipment.office_of_origin}</strong></div><span>→</span><div><small>Destination</small><strong>{shipment.destination}</strong></div></section>
        <section className="admin-invoice-parties"><div><small>Sender</small><h2>{shipment.sender_name}</h2><p>{shipment.sender_address}</p><p>{shipment.sender_phone}<br />{shipment.sender_email}</p></div><div><small>Recipient</small><h2>{shipment.recipient_name}</h2><p>{shipment.recipient_address}</p><p>{shipment.recipient_phone}<br />{shipment.recipient_email}</p></div></section>
        <section className="admin-invoice-details"><h2>Shipment details</h2><dl><div><dt>Service</dt><dd>{shipment.service_type}</dd></div><div><dt>Status</dt><dd>{shipment.current_status}</dd></div><div><dt>Collection date</dt><dd>{formatDate(shipment.collection_date)}</dd></div><div><dt>Delivery date</dt><dd>{formatDate(shipment.delivery_date)}</dd></div><div><dt>Package</dt><dd>{shipment.package_description}</dd></div><div><dt>Quantity / weight</dt><dd>{shipment.quantity} / {shipment.weight} {shipment.weight_unit}</dd></div></dl></section>
        <section className="admin-invoice-charges"><h2>Charges & declared value</h2><table><tbody><tr><th>Freight charge</th><td>{money(shipment.freight_price)}</td></tr><tr><th>Insurance</th><td>{money(shipment.insurance)}</td></tr><tr><th>Declared package value</th><td>{money(shipment.package_value)}</td></tr><tr><th>Payment status</th><td>{shipment.payment_status}</td></tr></tbody></table><div><span>Freight total</span><strong>{money(shipment.freight_price)}</strong></div></section>
        {!!events?.length && <section className="admin-invoice-events"><h2>Tracking history</h2><table><thead><tr><th>Date</th><th>Status</th><th>Location</th></tr></thead><tbody>{events.map((event) => <tr key={event.id}><td>{formatDate(event.event_time, true)}</td><td>{event.status}</td><td>{event.location}</td></tr>)}</tbody></table></section>}
        <footer className="admin-invoice-footer"><p>Thank you for choosing Lion Gold Shipping & Storage.</p><small>This document was generated from the secure operations system. Tracking: {shipment.tracking_number}</small></footer>
      </article>
    </>
  );
}
