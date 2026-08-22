import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { cache } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Container,
  FileText,
  ImageIcon,
  Info,
  Mail,
  MapPin,
  PackageCheck,
  PackageOpen,
  Phone,
  Route,
  Scale,
  Truck,
  UserRound,
} from "lucide-react";
import { SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";
import { TrackingForm } from "@/components/public/tracking-form";
import { createServiceClient } from "@/lib/supabase/service";
import { createShipmentImageSignedUrl } from "@/lib/supabase/storage";
import { parsePublicTrackingResult, type PublicTrackingResult } from "@/lib/types";

export const dynamic = "force-dynamic";

type TrackPageProps = {
  searchParams: Promise<{ number?: string | string[] }>;
};

const trackingPattern = /^[A-Z0-9][A-Z0-9-]{3,63}$/;

function normaliseTrackingNumber(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw?.trim().toUpperCase() ?? "";
}

function formatDate(value: string | null | undefined, includeTime = false) {
  if (!value) return "Not available";
  const date = new Date(value.length === 10 ? `${value}T00:00:00Z` : value);
  if (Number.isNaN(date.getTime())) return "Not available";
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(includeTime ? { hour: "2-digit", minute: "2-digit" } : {}),
    timeZone: "UTC",
  }).format(date);
}

function formatMoney(value: number | null | undefined, currency: string) {
  if (value === null || value === undefined || !Number.isFinite(value)) return "Not provided";
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

function titleCase(value: string | null | undefined) {
  if (!value) return "Not provided";
  return value.toLowerCase().replace(/(^|[\s-])\p{L}/gu, (letter) => letter.toUpperCase());
}

function maskEmail(value: string | null) {
  if (!value) return null;
  const [local, domain] = value.split("@");
  if (!local || !domain) return "Protected";
  return `${local.charAt(0)}•••@${domain}`;
}

function maskPhone(value: string | null) {
  if (!value) return null;
  const digits = value.replace(/\D/g, "");
  return digits.length >= 4 ? `••• ••• ${digits.slice(-4)}` : "Protected";
}

async function loadTrackingResult(number: string): Promise<
  | { kind: "found"; result: PublicTrackingResult }
  | { kind: "not-found" }
  | { kind: "unavailable" }
> {
  const supabase = createServiceClient();
  if (!supabase) return { kind: "unavailable" };

  try {
    const { data, error } = await supabase.rpc("track_shipment", { p_tracking_number: number });
    if (error) {
      console.error("Tracking lookup failed:", error.message);
      return { kind: "unavailable" };
    }
    if (data === null || data === undefined) return { kind: "not-found" };
    const result = parsePublicTrackingResult(data);
    if (!result) {
      console.error("Tracking lookup returned an unexpected response shape.");
      return { kind: "unavailable" };
    }
    return { kind: "found", result };
  } catch (error) {
    console.error("Tracking service unavailable:", error instanceof Error ? error.message : "Unknown error");
    return { kind: "unavailable" };
  }
}

const getTrackingResult = cache(loadTrackingResult);

export async function generateMetadata({ searchParams }: TrackPageProps): Promise<Metadata> {
  const params = await searchParams;
  const number = normaliseTrackingNumber(params.number);
  let title = "Track a shipment";
  let description = "Enter a LinxShip tracking number to view the latest shipment updates.";

  if (trackingPattern.test(number)) {
    const lookup = await getTrackingResult(number);
    if (lookup.kind === "found") {
      const { shipment } = lookup.result;
      title = `Shipment ${shipment.tracking_number}`;
      description = `${shipment.current_status}: shipment travelling from ${shipment.office_of_origin} to ${shipment.destination}.`;
    }
  }

  return {
    title,
    description,
    robots: { index: false, follow: false, nocache: true },
    openGraph: { title, description, images: [] },
    twitter: { title, description, images: [] },
  };
}

function TrackingState({
  kind,
  number,
}: {
  kind: "empty" | "invalid" | "not-found" | "unavailable";
  number: string;
}) {
  const content = {
    empty: {
      icon: PackageOpen,
      eyebrow: "Shipment tracking",
      title: "Find your shipment",
      copy: "Enter the tracking reference from your confirmation to see the latest journey updates.",
    },
    invalid: {
      icon: AlertTriangle,
      eyebrow: "Check the reference",
      title: "That tracking number is not valid",
      copy: "Use 4–64 letters, numbers, or hyphens. Spaces and other symbols are not accepted.",
    },
    "not-found": {
      icon: Route,
      eyebrow: "No match found",
      title: "We could not find that shipment",
      copy: "Check each character against your shipping confirmation, then try the lookup again.",
    },
    unavailable: {
      icon: AlertTriangle,
      eyebrow: "Service temporarily unavailable",
      title: "We cannot load tracking right now",
      copy: "Your reference has not been changed. Please wait a moment and try again, or contact our team for help.",
    },
  }[kind];
  const Icon = content.icon;

  return (
    <section className="track-state" aria-labelledby="track-state-title">
      <div className={`track-state__icon is-${kind}`}><Icon aria-hidden="true" /></div>
      <p className="public-eyebrow">{content.eyebrow}</p>
      <h1 id="track-state-title">{content.title}</h1>
      <p>{content.copy}</p>
      <TrackingForm compact defaultValue={kind === "empty" ? "" : number} id="state-tracking-number" />
      <Link href="/" className="track-state__back"><ArrowLeft aria-hidden="true" size={16} /> Return to the homepage</Link>
    </section>
  );
}

function ShipmentDetails({ result, cargoImageUrl }: { result: PublicTrackingResult; cargoImageUrl: string | null }) {
  const { shipment, events, messages } = result;
  const latestEvent = events[0];
  const lastUpdated = latestEvent?.event_time ?? shipment.updated_at;
  const senderEmail = maskEmail(shipment.sender_email);
  const senderPhone = maskPhone(shipment.sender_phone);
  const recipientEmail = maskEmail(shipment.recipient_email);
  const recipientPhone = maskPhone(shipment.recipient_phone);

  return (
    <>
      <section className="track-result-hero" aria-labelledby="tracking-title">
        <div>
          <p className="public-eyebrow public-eyebrow--lime"><PackageCheck aria-hidden="true" size={16} /> Shipment found</p>
          <h1 id="tracking-title">Tracking <span>{shipment.tracking_number}</span></h1>
          <p>Latest information from origin to destination.</p>
        </div>
        <div className={`track-status${shipment.is_delivered ? " is-delivered" : ""}`}>
          <span><span className="track-status__pulse" /> Current status</span>
          <strong>{shipment.current_status}</strong>
        </div>
      </section>

      <section className="track-summary" aria-label="Shipment summary">
        <div><CalendarDays aria-hidden="true" /><dl><dt>Collection date</dt><dd>{formatDate(shipment.collection_date)}</dd></dl></div>
        <div><Clock3 aria-hidden="true" /><dl><dt>Expected delivery</dt><dd>{formatDate(shipment.delivery_date)}</dd></dl></div>
        <div><Route aria-hidden="true" /><dl><dt>Last update</dt><dd>{formatDate(lastUpdated, true)}</dd></dl></div>
        <div><Truck aria-hidden="true" /><dl><dt>Service</dt><dd>{shipment.service_type}</dd></dl></div>
      </section>

      {messages.length > 0 && (
        <section className="track-panel track-messages" aria-labelledby="shipment-messages-title">
          <div className="track-section-heading">
            <div className="track-section-heading__icon"><Info aria-hidden="true" /></div>
            <div><p className="public-eyebrow">Updates from our team</p><h2 id="shipment-messages-title">Shipment messages</h2></div>
          </div>
          <div className="track-messages__list">
            {messages.map((message) => (
              <article key={message.id}>
                <p>{message.message}</p>
                <time dateTime={message.created_at}>{formatDate(message.created_at, true)}</time>
              </article>
            ))}
          </div>
        </section>
      )}

      <div className="track-layout">
        <div className="track-layout__main">
          <section className="track-panel" aria-labelledby="route-title">
            <div className="track-section-heading">
              <div className="track-section-heading__icon"><MapPin aria-hidden="true" /></div>
              <div><p className="public-eyebrow">Route</p><h2 id="route-title">Delivery information</h2></div>
            </div>
            <div className="track-route">
              <article>
                <div className="track-route__marker"><span /><small>From</small></div>
                <h3>{shipment.office_of_origin}</h3>
                <dl>
                  <div><dt><UserRound aria-hidden="true" /> Sender</dt><dd>{shipment.sender_name}</dd></div>
                  {senderPhone && <div><dt><Phone aria-hidden="true" /> Phone</dt><dd>{senderPhone}</dd></div>}
                  {senderEmail && <div><dt><Mail aria-hidden="true" /> Email</dt><dd>{senderEmail}</dd></div>}
                  <div><dt><MapPin aria-hidden="true" /> Address</dt><dd className="track-address">{shipment.sender_address}</dd></div>
                </dl>
              </article>
              <div className="track-route__line" aria-hidden="true"><Truck /><span /></div>
              <article>
                <div className="track-route__marker"><span /><small>To</small></div>
                <h3>{shipment.destination}</h3>
                <dl>
                  <div><dt><UserRound aria-hidden="true" /> Recipient</dt><dd>{shipment.recipient_name}</dd></div>
                  {recipientPhone && <div><dt><Phone aria-hidden="true" /> Phone</dt><dd>{recipientPhone}</dd></div>}
                  {recipientEmail && <div><dt><Mail aria-hidden="true" /> Email</dt><dd>{recipientEmail}</dd></div>}
                  <div><dt><MapPin aria-hidden="true" /> Address</dt><dd className="track-address">{shipment.recipient_address}</dd></div>
                </dl>
              </article>
            </div>
          </section>

          <section className="track-panel" aria-labelledby="package-title">
            <div className="track-section-heading">
              <div className="track-section-heading__icon"><PackageOpen aria-hidden="true" /></div>
              <div><p className="public-eyebrow">Contents</p><h2 id="package-title">Package information</h2></div>
            </div>
            <dl className="track-package-grid">
              <div><dt><FileText aria-hidden="true" /> Description</dt><dd>{shipment.package_description}</dd></div>
              <div><dt><Container aria-hidden="true" /> Service</dt><dd>{shipment.service_type}</dd></div>
              <div><dt><PackageCheck aria-hidden="true" /> Quantity</dt><dd>{shipment.quantity.toLocaleString("en-US")}</dd></div>
              <div><dt><Scale aria-hidden="true" /> Weight</dt><dd>{shipment.weight.toLocaleString("en-US")} {shipment.weight_unit}</dd></div>
              {shipment.show_billing && <div><dt>Declared value</dt><dd>{formatMoney(shipment.package_value, shipment.currency)}</dd></div>}
              {shipment.show_billing && <div><dt>Insurance</dt><dd>{formatMoney(shipment.insurance, shipment.currency)}</dd></div>}
            </dl>

            {shipment.show_billing && (
              <div className="track-billing" aria-label="Billing information">
                <div><CircleDollarSign aria-hidden="true" /><span>Billing details</span></div>
                <dl>
                  <div><dt>Freight price</dt><dd>{formatMoney(shipment.freight_price, shipment.currency)}</dd></div>
                  <div><dt>Payment status</dt><dd><span className="track-billing__status">{titleCase(shipment.payment_status)}</span></dd></div>
                  <div><dt>Billing status</dt><dd>{titleCase(shipment.billing_status)}</dd></div>
                </dl>
              </div>
            )}

            {cargoImageUrl && (
              <figure className="track-cargo-image">
                <div>
                  <Image
                    src={cargoImageUrl}
                    alt={`Cargo associated with shipment ${shipment.tracking_number}`}
                    width={1200}
                    height={800}
                    sizes="(max-width: 760px) calc(100vw - 80px), 760px"
                  />
                </div>
                <figcaption><ImageIcon aria-hidden="true" size={15} /> Shipment cargo image</figcaption>
              </figure>
            )}
          </section>
        </div>

        <aside className="track-layout__aside" aria-labelledby="timeline-title">
          <section className="track-panel track-timeline-panel">
            <div className="track-section-heading">
              <div className="track-section-heading__icon"><Route aria-hidden="true" /></div>
              <div><p className="public-eyebrow">Progress</p><h2 id="timeline-title">Tracking history</h2></div>
            </div>
            {events.length > 0 ? (
              <ol className="track-timeline">
                {events.map((event, index) => (
                  <li className={index === 0 ? "is-current" : ""} key={event.id}>
                    <span className="track-timeline__dot">{index === 0 && <CheckCircle2 aria-hidden="true" />}</span>
                    <div>
                      {index === 0 && <span className="track-timeline__latest">Latest update</span>}
                      <h3>{event.status}</h3>
                      {event.location && <p><MapPin aria-hidden="true" size={13} /> {event.location}</p>}
                      <time dateTime={event.event_time}>{formatDate(event.event_time, true)}</time>
                      {event.requires_payment && (
                        <p className="track-payment-notice"><CircleDollarSign aria-hidden="true" size={14} /> Payment required{event.billing_amount !== null ? ` — ${formatMoney(event.billing_amount, shipment.currency)}` : ""}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="track-timeline__empty"><Clock3 aria-hidden="true" /><p>No tracking events have been posted yet. Check back soon for an update.</p></div>
            )}
          </section>
        </aside>
      </div>

      <section className="track-again" aria-labelledby="track-again-title">
        <div><p className="public-eyebrow public-eyebrow--lime">Another delivery?</p><h2 id="track-again-title">Track another shipment.</h2></div>
        <TrackingForm compact id="another-tracking-number" />
      </section>
    </>
  );
}

export default async function TrackPage({ searchParams }: TrackPageProps) {
  const params = await searchParams;
  const number = normaliseTrackingNumber(params.number);
  let content: React.ReactNode;

  if (!number) {
    content = <TrackingState kind="empty" number="" />;
  } else if (!trackingPattern.test(number)) {
    content = <TrackingState kind="invalid" number={number} />;
  } else {
    const lookup = await getTrackingResult(number);
    if (lookup.kind === "found") {
      const cargoImageUrl = await createShipmentImageSignedUrl(lookup.result.shipment.cargo_image_path);
      content = <ShipmentDetails result={lookup.result} cargoImageUrl={cargoImageUrl} />;
    } else {
      content = <TrackingState kind={lookup.kind} number={number} />;
    }
  }

  return (
    <div className="track-page">
      <a className="public-skip-link" href="#tracking-content">Skip to shipment details</a>
      <SiteHeader tone="dark" />
      <main className="public-shell track-main" id="tracking-content" tabIndex={-1}>
        {content}
      </main>
      <SiteFooter />
    </div>
  );
}
