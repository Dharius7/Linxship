"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { logoutAction } from "@/lib/actions/admin";
import { AdminIcon, type AdminIconName } from "./icons";

const links: Array<{ href: string; label: string; icon: AdminIconName }> = [
  { href: "/admin", label: "Overview", icon: "dashboard" },
  { href: "/admin/shipments", label: "Shipments", icon: "truck" },
  { href: "/admin/statuses", label: "Status catalog", icon: "settings" },
  { href: "/admin/contacts", label: "Contact inbox", icon: "inbox" },
  { href: "/admin/activity", label: "Activity log", icon: "activity" },
];

function isActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === href : pathname.startsWith(href);
}

export function AdminNav({ displayName, email }: { displayName: string; email: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [mobile, setMobile] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!mobile || !open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusableSelector =
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    window.requestAnimationFrame(() => {
      sidebarRef.current?.querySelector<HTMLElement>(focusableSelector)?.focus();
    });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        window.requestAnimationFrame(() => menuButtonRef.current?.focus());
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = Array.from(
        sidebarRef.current?.querySelectorAll<HTMLElement>(focusableSelector) ?? [],
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [mobile, open]);

  useEffect(() => {
    const mobileQuery = window.matchMedia("(max-width: 980px)");
    const updateViewport = (event: MediaQueryListEvent | MediaQueryList) => {
      setMobile(event.matches);
      if (!event.matches) setOpen(false);
    };
    mobileQuery.addEventListener("change", updateViewport);
    updateViewport(mobileQuery);
    return () => mobileQuery.removeEventListener("change", updateViewport);
  }, []);

  return (
    <>
      <header className="admin-mobile-header">
        <Link href="/admin" className="admin-mobile-brand" aria-label="Lion Gold admin dashboard">
          <Image src="/images/logo-dark.png" alt="Lion Gold" width={289} height={96} />
        </Link>
        <button
          ref={menuButtonRef}
          type="button"
          className="admin-menu-button"
          aria-label={open ? "Close navigation" : "Open navigation"}
          aria-expanded={open}
          aria-controls="admin-navigation"
          onClick={() => setOpen((value) => !value)}
        >
          <AdminIcon name={open ? "close" : "menu"} />
        </button>
      </header>
      {open && <button className="admin-nav-backdrop" tabIndex={-1} aria-label="Close navigation" onClick={() => { setOpen(false); window.requestAnimationFrame(() => menuButtonRef.current?.focus()); }} />}
      <aside
        ref={sidebarRef}
        className={`admin-sidebar${open ? " is-open" : ""}`}
        id="admin-navigation"
        role={mobile ? "dialog" : undefined}
        aria-modal={mobile && open ? true : undefined}
        aria-label={mobile ? "Administrator navigation" : undefined}
        aria-hidden={mobile && !open ? true : undefined}
        inert={mobile && !open ? true : undefined}
      >
        <div className="admin-sidebar-inner">
          <Link href="/admin" className="admin-brand" onClick={() => setOpen(false)}>
            <span className="admin-brand-mark"><AdminIcon name="box" /></span>
            <span><strong>Lion Gold</strong><small>Operations desk</small></span>
          </Link>
          <nav className="admin-nav" aria-label="Admin navigation">
            <span className="admin-nav-label">Workspace</span>
            {links.map((link) => {
              const active = isActive(pathname, link.href);
              return (
              <Link
                key={link.href}
                href={link.href}
                className={active ? "is-active" : undefined}
                aria-current={active ? "page" : undefined}
                onClick={() => setOpen(false)}
              >
                <AdminIcon name={link.icon} />
                <span>{link.label}</span>
              </Link>
              );
            })}
          </nav>
          <div className="admin-sidebar-footer">
            <div className="admin-user-card">
              <span className="admin-user-avatar">{displayName.slice(0, 1).toUpperCase()}</span>
              <span className="admin-user-copy"><strong>{displayName}</strong><small>{email}</small></span>
            </div>
            <form action={logoutAction}>
              <button className="admin-logout" type="submit"><AdminIcon name="logout" />Sign out</button>
            </form>
          </div>
        </div>
      </aside>
    </>
  );
}
