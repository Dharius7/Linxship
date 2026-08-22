import Link from "next/link";
import { ArrowUpRight, Mail, MapPin } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";

export function SiteFooter() {
  return (
    <footer className="public-footer">
      <div className="public-shell public-footer__top">
        <div className="public-footer__brand">
          <Link className="public-brand public-brand--footer" href="/" aria-label="LinxShip home">
            <BrandLogo />
          </Link>
          <p>Reliable worldwide freight, secure storage, and a clear view of every mile.</p>
        </div>
        <nav className="public-footer__links" aria-label="Footer">
          <p>Explore</p>
          <Link href="/#services">Services</Link>
          <Link href="/#about">About us</Link>
          <Link href="/#process">How it works</Link>
          <Link href="/#track">Track a shipment</Link>
        </nav>
        <div className="public-footer__links">
          <p>Contact</p>
          <a href="mailto:info@liongoldss.com"><Mail aria-hidden="true" size={15} /> info@liongoldss.com</a>
          <span><MapPin aria-hidden="true" size={15} /> New York, NY 11226<br />United States</span>
        </div>
        <Link className="public-footer__cta" href="/#contact">
          Start a conversation <ArrowUpRight aria-hidden="true" size={18} />
        </Link>
      </div>
      <div className="public-shell public-footer__bottom">
        <p>© {new Date().getFullYear()} LinxShip Logistics &amp; Storage. All rights reserved.</p>
        <p>Cargo moves. Confidence stays.</p>
      </div>
    </footer>
  );
}
