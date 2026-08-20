"use client";

import { useActionState, useEffect } from "react";
import { createStatusAction, type AdminActionState } from "@/lib/actions/admin";
import { ActionAlert, SubmitButton } from "./ui";

const initialState: AdminActionState = { status: "idle", message: "" };

export function StatusForm({ nextSortOrder }: { nextSortOrder: number }) {
  const [state, action] = useActionState(createStatusAction, initialState);

  useEffect(() => {
    if (state.status !== "error") return;
    const firstField = Object.keys(state.fieldErrors ?? {})[0];
    if (firstField) window.requestAnimationFrame(() => document.getElementById(firstField)?.focus());
  }, [state.fieldErrors, state.status]);
  return (
    <form action={action} className="admin-form-stack">
      <ActionAlert state={state} />
      <div className="admin-field"><label htmlFor="name">Status name</label><input id="name" name="name" placeholder="e.g. Customs clearance" maxLength={64} required aria-invalid={Boolean(state.fieldErrors?.name) || undefined} aria-describedby={state.fieldErrors?.name ? "name-error" : undefined} />{state.fieldErrors?.name && <small className="admin-field-error" id="name-error">{state.fieldErrors.name}</small>}</div>
      <div className="admin-field"><label htmlFor="sort_order">Display order</label><input id="sort_order" name="sort_order" type="number" min="0" defaultValue={nextSortOrder} aria-invalid={Boolean(state.fieldErrors?.sort_order) || undefined} aria-describedby={state.fieldErrors?.sort_order ? "sort_order-error" : undefined} />{state.fieldErrors?.sort_order && <small className="admin-field-error" id="sort_order-error">{state.fieldErrors.sort_order}</small>}</div>
      <label className="admin-check"><input type="checkbox" name="is_terminal" /><span><strong>Terminal status</strong><small>Completes a shipment, such as Delivered or Cancelled.</small></span></label>
      <div><SubmitButton pendingLabel="Adding status…">Add status</SubmitButton></div>
    </form>
  );
}
