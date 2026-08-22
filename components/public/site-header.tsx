"use client";

import Link from "next/link";
import { ArrowUpRight, Menu, PackageSearch, X } from "lucide-react";
import { useEffect, useState } from "react";
import { BrandLogo } from "@/components/brand-logo";

const navigation = [
  { href: "/#services", label: "Services" },
  { href: "/#about", label: "About" },
  { href: "/#process", label: "How it works" },
  { href: "/#contact", label: "Contact" },
];

export function SiteHeader({ tone = "light" }: { tone?: "light" | "dark" }) {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.body.classList.toggle("menu-is-open", menuOpen);
    return () => document.body.classList.remove("menu-is-open");
  }, [menuOpen]);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 901px)");
    const closeAtDesktop = (event: MediaQueryListEvent | MediaQueryList) => {
      if (event.matches) setMenuOpen(false);
    };
    desktop.addEventListener("change", closeAtDesktop);
    closeAtDesktop(desktop);
    return () => desktop.removeEventListener("change", closeAtDesktop);
  }, []);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className={`public-header public-header--${tone}`}>
      <div className="public-shell public-header__inner">
        <Link className="public-brand" href="/" onClick={closeMenu} aria-label="LinxShip home">
          <BrandLogo priority />
        </Link>

        <nav className="public-nav" aria-label="Primary navigation">
          {navigation.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>

        <Link className="public-header__track" href="/#track">
          <PackageSearch aria-hidden="true" size={17} />
          <span>Track shipment</span>
          <ArrowUpRight className="public-header__track-arrow" aria-hidden="true" size={16} />
        </Link>

        <button
          className="public-menu-button"
          type="button"
          aria-label={menuOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>
      </div>

      <div className={`public-mobile-menu${menuOpen ? " is-open" : ""}`} id="mobile-navigation">
        <nav className="public-mobile-menu__nav" aria-label="Mobile navigation">
          {navigation.map((item, index) => (
            <Link key={item.href} href={item.href} onClick={closeMenu}>
              <span>0{index + 1}</span>
              {item.label}
              <ArrowUpRight aria-hidden="true" size={18} />
            </Link>
          ))}
          <Link className="public-mobile-menu__track" href="/#track" onClick={closeMenu}>
            <PackageSearch aria-hidden="true" size={19} /> Track your shipment
          </Link>
        </nav>
      </div>
    </header>
  );
}
