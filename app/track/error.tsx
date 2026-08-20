"use client";

import Link from "next/link";
import { AlertTriangle, ArrowLeft, RotateCw } from "lucide-react";
import { SiteHeader } from "@/components/public/site-header";

export default function TrackingError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="track-page">
      <SiteHeader tone="dark" />
      <main className="public-shell track-main">
        <section className="track-state" role="alert">
          <div className="track-state__icon is-unavailable"><AlertTriangle aria-hidden="true" /></div>
          <p className="public-eyebrow">Unexpected error</p>
          <h1>We could not open this shipment</h1>
          <p>The tracking reference has not been changed. You can safely try the request again.</p>
          <div className="track-error-actions">
            <button type="button" onClick={reset}><RotateCw aria-hidden="true" size={17} /> Try again</button>
            <Link href="/"><ArrowLeft aria-hidden="true" size={17} /> Return home</Link>
          </div>
        </section>
      </main>
    </div>
  );
}
