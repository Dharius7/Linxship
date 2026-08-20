"use client";

import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="system-page">
      <div className="system-card" role="alert">
        <span className="system-card__icon"><AlertTriangle aria-hidden="true" /></span>
        <p className="system-card__eyebrow">Something went wrong</p>
        <h1>We could not load this page.</h1>
        <p>Please try again. If the problem continues, our support team can help.</p>
        <div className="system-card__actions">
          <button type="button" onClick={reset}><RotateCcw size={17} /> Try again</button>
          <Link href="/">Return home</Link>
        </div>
      </div>
    </main>
  );
}
