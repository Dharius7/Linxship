"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal, useFormStatus } from "react-dom";
import { AdminIcon } from "./icons";
import type { AdminActionState } from "@/lib/actions/admin";

export function SubmitButton({
  children,
  pendingLabel = "Saving…",
  className = "admin-button",
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return <button type="submit" className={className} disabled={pending}>{pending ? pendingLabel : children}</button>;
}

export function ActionAlert({ state }: { state: AdminActionState }) {
  if (state.status === "idle" || !state.message) return null;
  return (
    <div className={`admin-alert admin-alert--${state.status}`} role={state.status === "error" ? "alert" : "status"}>
      <AdminIcon name={state.status === "success" ? "check" : "close"} />
      <span>{state.message}</span>
    </div>
  );
}

export function ConfirmButton({
  children,
  message,
  className = "admin-button admin-button--danger admin-button--small",
}: {
  children: React.ReactNode;
  message: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    cancelRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      } else if (event.key === "Tab") {
        const focusable = dialogRef.current?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)");
        if (!focusable?.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const close = () => {
    setOpen(false);
    window.requestAnimationFrame(() => buttonRef.current?.focus());
  };

  const confirm = () => {
    const form = buttonRef.current?.form;
    setOpen(false);
    form?.requestSubmit();
  };

  return (
    <>
      <button ref={buttonRef} type="button" className={className} onClick={() => setOpen(true)}>{children}</button>
      {open && createPortal(
        <div className="admin-dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
          <div ref={dialogRef} className="admin-dialog" role="alertdialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descriptionId}>
            <span className="admin-dialog-icon"><AdminIcon name="close" /></span>
            <span className="admin-eyebrow">Destructive action</span>
            <h2 id={titleId}>Are you absolutely sure?</h2>
            <p id={descriptionId}>{message}</p>
            <div className="admin-dialog-actions">
              <button ref={cancelRef} type="button" className="admin-button admin-button--secondary" onClick={close}>Cancel</button>
              <button type="button" className="admin-button admin-button--danger" onClick={confirm}>Yes, delete it</button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}

export function PrintButton() {
  return <button type="button" className="admin-button" onClick={() => window.print()}><AdminIcon name="document" />Print invoice</button>;
}
