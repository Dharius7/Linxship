export default function Loading() {
  return (
    <main className="system-page" aria-busy="true" aria-label="Loading page">
      <div className="system-card system-card--loading">
        <div className="loading-line loading-line--short" />
        <div className="loading-line loading-line--title" />
        <div className="loading-line" />
        <div className="loading-line" />
      </div>
    </main>
  );
}
