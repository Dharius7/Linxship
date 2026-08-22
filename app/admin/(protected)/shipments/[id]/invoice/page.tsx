import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDate, formatMoney } from "@/components/admin/format";
import { PrintButton } from "@/components/admin/ui";
import { PageHeader, StatusBadge } from "@/components/admin/server-ui";
import { AdminIcon } from "@/components/admin/icons";
import { BrandLogo } from "@/components/brand-logo";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Shipment invoice" };

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: shipment }, { data: events }] = await Promise.all([
    supabase.from("shipments").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("tracking_events")
      .select("id,status,location,event_time,requires_payment,billing_amount")
      .eq("shipment_id", id)
      .order("event_time", { ascending: true }),
  ]);
  if (!shipment) notFound();
  const currency = shipment.currency;
  const senderContact = [shipment.sender_phone, shipment.sender_email].filter(Boolean).join("  ·  ");
  const recipientContact = [shipment.recipient_phone, shipment.recipient_email].filter(Boolean).join("  ·  ");

  return (
    <>
      <div className="admin-no-print"><PageHeader eyebrow={shipment.tracking_number} title="Shipment invoice" description="A clean, printable commercial summary."><Link href={`/admin/shipments/${id}`} className="admin-button admin-button--secondary">Back to shipment</Link><PrintButton /></PageHeader></div>
      <article className="admin-invoice">
        <header className="invoice-head">
          <div className="invoice-head__brand"><BrandLogo /></div>
          <div className="invoice-head__meta">
            <span className="invoice-head__label">Shipment invoice</span>
            <h1>{shipment.tracking_number}</h1>
            <div className="invoice-head__facts">
              <span>Issued {formatDate(shipment.created_at)}</span>
              <StatusBadge status={shipment.current_status} delivered={shipment.is_delivered} />
            </div>
          </div>
        </header>

        <section className="invoice-parties">
          <div className="invoice-party">
            <span className="invoice-party__label">Sender</span>
            <h2>{shipment.sender_name}</h2>
            <p>{shipment.sender_address}</p>
            {senderContact && <p className="invoice-party__contact">{senderContact}</p>}
          </div>
          <div className="invoice-party invoice-party--to">
            <span className="invoice-party__label">Recipient</span>
            <h2>{shipment.recipient_name}</h2>
            <p>{shipment.recipient_address}</p>
            {recipientContact && <p className="invoice-party__contact">{recipientContact}</p>}
          </div>
        </section>

        <section className="invoice-route">
          <div>
            <small>Origin</small>
            <strong>{shipment.office_of_origin}</strong>
            <span>Collected {formatDate(shipment.collection_date)}</span>
          </div>
          <div className="invoice-route__arrow" aria-hidden="true"><AdminIcon name="truck" /></div>
          <div>
            <small>Destination</small>
            <strong>{shipment.destination}</strong>
            <span>Due {formatDate(shipment.delivery_date)}</span>
          </div>
        </section>

        <section className="invoice-panel">
          <h3><AdminIcon name="box" /> Shipment details</h3>
          <dl>
            <div><dt>Service</dt><dd>{shipment.service_type}</dd></div>
            <div><dt>Quantity</dt><dd>{shipment.quantity}</dd></div>
            <div><dt>Weight</dt><dd>{shipment.weight} {shipment.weight_unit}</dd></div>
            <div><dt>Package</dt><dd>{shipment.package_description}</dd></div>
          </dl>
        </section>

        <section className="invoice-charges">
          <h3><AdminIcon name="money" /> Charges &amp; declared value</h3>
          <table>
            <tbody>
              <tr><th>Freight charge</th><td>{formatMoney(shipment.freight_price, currency)}</td></tr>
              <tr><th>Insurance</th><td>{formatMoney(shipment.insurance, currency)}</td></tr>
              <tr><th>Declared package value</th><td>{formatMoney(shipment.package_value, currency)}</td></tr>
            </tbody>
          </table>
          <div className="invoice-total">
            <div className="invoice-total__status"><span>Payment status</span><StatusBadge status={shipment.payment_status} /></div>
            <div className="invoice-total__amount"><span>Freight total</span><strong>{formatMoney(shipment.freight_price, currency)}</strong></div>
          </div>
        </section>

        {!!events?.length && (
          <section className="invoice-history">
            <h3><AdminIcon name="clock" /> Tracking history</h3>
            <table>
              <thead><tr><th>Date</th><th>Status</th><th>Location</th><th>Payment due</th></tr></thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event.id}>
                    <td>{formatDate(event.event_time, true)}</td>
                    <td><StatusBadge status={event.status} /></td>
                    <td>{event.location}</td>
                    <td>{event.requires_payment ? formatMoney(event.billing_amount, currency) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        <footer className="invoice-foot">
          <p>Thank you for choosing LinxShip Logistics &amp; Storage.</p>
          <small>This document was generated from the secure operations system. Tracking: {shipment.tracking_number}</small>
        </footer>
      </article>
    </>
  );
}
