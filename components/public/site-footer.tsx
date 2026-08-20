import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Mail, MapPin } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="public-footer">
      <div className="public-shell public-footer__top">
        <div className="public-footer__brand">
          <Link className="public-brand" href="/" aria-label="Lion Gold Shipping home">
            <Image src="/images/logo-dark.png" alt="Lion Gold Shipping and Storage" width={289} height={96} />
          </Link>
          <p>Reliable worldwide freight, secure storage, and a clear view of every mile.</p>
        </div>
        <div className="public-footer__links">
          <p>Explore</p>
          <Link href="/#services">Services</Link>
          <Link href="/#about">About us</Link>
          <Link href="/#process">How it works</Link>
          <Link href="/#track">Track a shipment</Link>
        </div>
        <div className="public-footer__links">
          <p>Contact</p>
          <a href="mailto:info@liongoldss.com"><Mail aria-hidden="true" size={15} /> info@liongoldss.com</a>
          <span><MapPin aria-hidden="true" size={15} /> New York, NY 11226<br />United States</span>
        </div>
        <Link className="public-footer__cta" href="/#contact">
          Start a conversation <ArrowUpRight aria-hidden="true" size={20} />
        </Link>
      </div>
      <div className="public-shell public-footer__bottom">
        <p>© {new Date().getFullYear()} Lion Gold Shipping &amp; Storage.</p>
        <p>Built for clear, confident logistics.</p>
      </div>
    </footer>
  );
}
