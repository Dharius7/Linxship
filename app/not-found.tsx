import Link from "next/link";
import { ArrowLeft, MapPinOff } from "lucide-react";

export default function NotFound() {
  return (
    <main className="system-page">
      <div className="system-card">
        <span className="system-card__icon"><MapPinOff aria-hidden="true" /></span>
        <p className="system-card__eyebrow">404 · Off route</p>
        <h1>This page is not on our map.</h1>
        <p>The address may have changed, or the page may no longer be available.</p>
        <div className="system-card__actions">
          <Link href="/"><ArrowLeft size={17} /> Return home</Link>
        </div>
      </div>
    </main>
  );
}
