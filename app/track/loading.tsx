import { SiteHeader } from "@/components/public/site-header";

export default function TrackingLoading() {
  return (
    <div className="track-page">
      <SiteHeader tone="dark" />
      <main className="public-shell track-main" aria-busy="true" aria-label="Loading shipment">
        <div className="track-loading-heading">
          <span className="track-skeleton track-skeleton--eyebrow" />
          <span className="track-skeleton track-skeleton--title" />
          <span className="track-skeleton track-skeleton--copy" />
        </div>
        <div className="track-loading-summary">
          {Array.from({ length: 4 }, (_, index) => <span className="track-skeleton" key={index} />)}
        </div>
        <div className="track-loading-grid">
          <span className="track-skeleton" />
          <span className="track-skeleton" />
        </div>
        <p className="sr-only" role="status">Loading the latest shipment information…</p>
      </main>
    </div>
  );
}
