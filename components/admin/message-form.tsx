"use client";

import { useActionState, useEffect } from "react";
import {
  addShipmentMessageAction,
  updateShipmentMessageAction,
  type AdminActionState,
} from "@/lib/actions/admin";
import { ActionAlert, SubmitButton } from "./ui";

const initialState: AdminActionState = { status: "idle", message: "" };

export function MessageForm({ shipmentId, message }: { shipmentId: string; message?: { id: string; message: string } }) {
  const serverAction = message
    ? updateShipmentMessageAction.bind(null, shipmentId, message.id)
    : addShipmentMessageAction.bind(null, shipmentId);
  const [state, action] = useActionState(serverAction, initialState);

  useEffect(() => {
    if (state.status === "error" && state.fieldErrors?.message) {
      window.requestAnimationFrame(() => document.getElementById("message")?.focus());
    }
  }, [state.fieldErrors?.message, state.status]);
  return (
    <form action={action} className="admin-form-stack">
      <ActionAlert state={state} />
      <div className="admin-field">
        <label htmlFor="message">Customer-facing message</label>
        <textarea id="message" name="message" rows={6} maxLength={4000} defaultValue={message?.message ?? ""} placeholder="Write a clear update that will be visible with this shipment…" required aria-invalid={Boolean(state.fieldErrors?.message) || undefined} aria-describedby="message-help" />
        <div className="admin-field-help"><span id="message-help" className={state.fieldErrors?.message ? "admin-field-error" : undefined}>{state.fieldErrors?.message || "Plain text only · 4,000 characters maximum"}</span></div>
      </div>
      <div><SubmitButton pendingLabel={message ? "Saving message…" : "Publishing message…"}>{message ? "Save message" : "Publish message"}</SubmitButton></div>
    </form>
  );
}
