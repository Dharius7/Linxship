"use client";

import { useActionState, useEffect } from "react";
import {
  addTrackingEventAction,
  updateTrackingEventAction,
  type AdminActionState,
} from "@/lib/actions/admin";
import { utcDateTime } from "./format";
import { ActionAlert, SubmitButton } from "./ui";

const initialState: AdminActionState = { status: "idle", message: "" };

export function EventForm({
  shipmentId,
  event,
  statuses,
  currency,
}: {
  shipmentId: string;
  event?: { id: string; status: string; location: string; event_time: string; requires_payment: boolean; billing_amount: number | string };
  statuses: Array<{ id: string; name: string }>;
  currency: string;
}) {
  const serverAction = event
    ? updateTrackingEventAction.bind(null, shipmentId, event.id)
    : addTrackingEventAction.bind(null, shipmentId);
  const [state, action] = useActionState(serverAction, initialState);

  useEffect(() => {
    if (state.status !== "error") return;
    const firstField = Object.keys(state.fieldErrors ?? {})[0];
    if (firstField) window.requestAnimationFrame(() => document.getElementById(firstField)?.focus());
  }, [state.fieldErrors, state.status]);

  const a11y = (name: string) => ({
    "aria-invalid": Boolean(state.fieldErrors?.[name]) || undefined,
    "aria-describedby": state.fieldErrors?.[name] ? `${name}-error` : undefined,
  });
  return (
    <form action={action} className="admin-form-stack">
      <ActionAlert state={state} />
      <div className="admin-form-grid admin-form-grid--2">
        <div className="admin-field"><label htmlFor="status">Status</label><input id="status" name="status" list="event-statuses" defaultValue={event?.status ?? ""} required {...a11y("status")} /><datalist id="event-statuses">{statuses.map((status) => <option key={status.id} value={status.name} />)}</datalist>{state.fieldErrors?.status && <small className="admin-field-error" id="status-error">{state.fieldErrors.status}</small>}</div>
        <div className="admin-field"><label htmlFor="location">Location</label><input id="location" name="location" defaultValue={event?.location ?? ""} placeholder="City, country or facility" required {...a11y("location")} />{state.fieldErrors?.location && <small className="admin-field-error" id="location-error">{state.fieldErrors.location}</small>}</div>
        <div className="admin-field"><label htmlFor="event_time">Event date & time (UTC)</label><input id="event_time" name="event_time" type="datetime-local" defaultValue={utcDateTime(event?.event_time)} required {...a11y("event_time")} />{state.fieldErrors?.event_time && <small className="admin-field-error" id="event_time-error">{state.fieldErrors.event_time}</small>}</div>
        <div className="admin-field"><label htmlFor="billing_amount">Payment amount ({currency})</label><input id="billing_amount" name="billing_amount" type="number" min="0" step="0.01" defaultValue={event?.billing_amount ?? 0} {...a11y("billing_amount")} />{state.fieldErrors?.billing_amount && <small className="admin-field-error" id="billing_amount-error">{state.fieldErrors.billing_amount}</small>}</div>
      </div>
      <label className="admin-check"><input type="checkbox" name="requires_payment" defaultChecked={event?.requires_payment ?? false} /><span><strong>Customer payment required</strong><small>The amount will only appear publicly when billing visibility is enabled.</small></span></label>
      <div><SubmitButton pendingLabel={event ? "Saving event…" : "Adding event…"}>{event ? "Save event" : "Add tracking event"}</SubmitButton></div>
    </form>
  );
}
