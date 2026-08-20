"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import {
  createShipmentAction,
  updateShipmentAction,
  type AdminActionState,
} from "@/lib/actions/admin";
import { ActionAlert, SubmitButton } from "./ui";
import { AdminIcon } from "./icons";

export type ShipmentFormValues = {
  tracking_number?: string | null;
  sender_name?: string | null;
  sender_phone?: string | null;
  sender_email?: string | null;
  sender_address?: string | null;
  recipient_name?: string | null;
  recipient_phone?: string | null;
  recipient_email?: string | null;
  recipient_address?: string | null;
  payment_status?: string | null;
  service_type?: string | null;
  office_of_origin?: string | null;
  destination?: string | null;
  insurance?: number | string | null;
  quantity?: number | string | null;
  weight?: number | string | null;
  freight_price?: number | string | null;
  package_value?: number | string | null;
  currency?: string | null;
  weight_unit?: string | null;
  package_description?: string | null;
  billing_status?: string | null;
  collection_date?: string | null;
  delivery_date?: string | null;
  cargo_image_path?: string | null;
  shipment_details?: string | null;
  current_status?: string | null;
  is_delivered?: boolean | null;
  show_billing?: boolean | null;
};

const initialState: AdminActionState = { status: "idle", message: "" };

function ErrorText({ name, state }: { name: string; state: AdminActionState }) {
  const error = state.fieldErrors?.[name];
  return error ? <small className="admin-field-error" id={`${name}-error`}>{error}</small> : null;
}

function errorAttributes(name: string, state: AdminActionState) {
  const invalid = Boolean(state.fieldErrors?.[name]);
  return {
    "aria-invalid": invalid || undefined,
    "aria-describedby": invalid ? `${name}-error` : undefined,
  };
}

export function ShipmentForm({
  mode,
  shipmentId,
  initial,
  statuses,
}: {
  mode: "create" | "edit";
  shipmentId?: string;
  initial: ShipmentFormValues;
  statuses: Array<{ id: string; name: string }>;
}) {
  const serverAction = mode === "create"
    ? createShipmentAction
    : updateShipmentAction.bind(null, shipmentId || "");
  const [state, action] = useActionState(serverAction, initialState);
  const router = useRouter();

  useEffect(() => {
    if (state.redirectTo) {
      router.push(state.redirectTo);
      router.refresh();
    }
  }, [router, state.redirectTo]);

  useEffect(() => {
    if (state.status !== "error") return;
    const firstField = Object.keys(state.fieldErrors ?? {})[0];
    if (firstField) {
      window.requestAnimationFrame(() => document.getElementById(firstField)?.focus());
    }
  }, [state.fieldErrors, state.status]);

  return (
    <form action={action} className="admin-form-stack" encType="multipart/form-data" noValidate>
      <ActionAlert state={state} />
      <div className="admin-form-grid admin-form-grid--2">
        <section className="admin-panel admin-form-section">
          <div className="admin-section-heading"><span><AdminIcon name="user" /></span><div><h2>Sender details</h2><p>Who and where the package is coming from.</p></div></div>
          <div className="admin-form-grid admin-form-grid--2">
            <div className="admin-field admin-field--full"><label htmlFor="sender_name">Full name</label><input id="sender_name" name="sender_name" defaultValue={initial.sender_name ?? ""} required {...errorAttributes("sender_name", state)} /><ErrorText name="sender_name" state={state} /></div>
            <div className="admin-field"><label htmlFor="sender_phone">Phone</label><input id="sender_phone" name="sender_phone" type="tel" defaultValue={initial.sender_phone ?? ""} {...errorAttributes("sender_phone", state)} /><ErrorText name="sender_phone" state={state} /></div>
            <div className="admin-field"><label htmlFor="sender_email">Email</label><input id="sender_email" name="sender_email" type="email" defaultValue={initial.sender_email ?? ""} {...errorAttributes("sender_email", state)} /><ErrorText name="sender_email" state={state} /></div>
            <div className="admin-field admin-field--full"><label htmlFor="sender_address">Address</label><textarea id="sender_address" name="sender_address" rows={3} defaultValue={initial.sender_address ?? ""} required {...errorAttributes("sender_address", state)} /><ErrorText name="sender_address" state={state} /></div>
          </div>
        </section>
        <section className="admin-panel admin-form-section">
          <div className="admin-section-heading"><span><AdminIcon name="box" /></span><div><h2>Recipient details</h2><p>Who and where the package is going to.</p></div></div>
          <div className="admin-form-grid admin-form-grid--2">
            <div className="admin-field admin-field--full"><label htmlFor="recipient_name">Full name</label><input id="recipient_name" name="recipient_name" defaultValue={initial.recipient_name ?? ""} required {...errorAttributes("recipient_name", state)} /><ErrorText name="recipient_name" state={state} /></div>
            <div className="admin-field"><label htmlFor="recipient_phone">Phone</label><input id="recipient_phone" name="recipient_phone" type="tel" defaultValue={initial.recipient_phone ?? ""} {...errorAttributes("recipient_phone", state)} /><ErrorText name="recipient_phone" state={state} /></div>
            <div className="admin-field"><label htmlFor="recipient_email">Email</label><input id="recipient_email" name="recipient_email" type="email" defaultValue={initial.recipient_email ?? ""} {...errorAttributes("recipient_email", state)} /><ErrorText name="recipient_email" state={state} /></div>
            <div className="admin-field admin-field--full"><label htmlFor="recipient_address">Address</label><textarea id="recipient_address" name="recipient_address" rows={3} defaultValue={initial.recipient_address ?? ""} required {...errorAttributes("recipient_address", state)} /><ErrorText name="recipient_address" state={state} /></div>
          </div>
        </section>
      </div>

      <section className="admin-panel admin-form-section">
        <div className="admin-section-heading"><span><AdminIcon name="truck" /></span><div><h2>Shipment information</h2><p>Routing, service, timing, and current progress.</p></div></div>
        <div className="admin-form-grid admin-form-grid--3">
          <div className="admin-field"><label htmlFor="tracking_number">Tracking number</label><input id="tracking_number" name="tracking_number" defaultValue={initial.tracking_number ?? ""} minLength={mode === "create" ? 12 : 4} maxLength={64} pattern="[A-Za-z0-9][A-Za-z0-9-]+" required className="admin-mono-input" {...errorAttributes("tracking_number", state)} /><ErrorText name="tracking_number" state={state} /></div>
          <div className="admin-field"><label htmlFor="service_type">Service type</label><input id="service_type" name="service_type" placeholder="Air freight" defaultValue={initial.service_type ?? ""} required {...errorAttributes("service_type", state)} /><ErrorText name="service_type" state={state} /></div>
          <div className="admin-field"><label htmlFor="current_status">Current status</label><input id="current_status" name="current_status" list="shipment-status-list" defaultValue={initial.current_status ?? "Pending"} required {...errorAttributes("current_status", state)} /><datalist id="shipment-status-list">{statuses.map((status) => <option key={status.id} value={status.name} />)}</datalist><ErrorText name="current_status" state={state} /></div>
          <div className="admin-field"><label htmlFor="office_of_origin">Office of origin</label><input id="office_of_origin" name="office_of_origin" defaultValue={initial.office_of_origin ?? ""} required {...errorAttributes("office_of_origin", state)} /><ErrorText name="office_of_origin" state={state} /></div>
          <div className="admin-field"><label htmlFor="destination">Destination</label><input id="destination" name="destination" defaultValue={initial.destination ?? ""} required {...errorAttributes("destination", state)} /><ErrorText name="destination" state={state} /></div>
          <div className="admin-field"><label htmlFor="quantity">Quantity</label><input id="quantity" name="quantity" type="number" min="1" step="1" defaultValue={initial.quantity ?? 1} required {...errorAttributes("quantity", state)} /><ErrorText name="quantity" state={state} /></div>
          <div className="admin-field"><label htmlFor="collection_date">Collection date</label><input id="collection_date" name="collection_date" type="date" defaultValue={initial.collection_date ?? ""} {...errorAttributes("collection_date", state)} /><ErrorText name="collection_date" state={state} /></div>
          <div className="admin-field"><label htmlFor="delivery_date">Expected delivery</label><input id="delivery_date" name="delivery_date" type="date" defaultValue={initial.delivery_date ?? ""} {...errorAttributes("delivery_date", state)} /><ErrorText name="delivery_date" state={state} /></div>
          <div className="admin-field"><label htmlFor="weight">Weight</label><div className="admin-combo-field"><input id="weight" name="weight" type="number" min="0" step="0.01" defaultValue={initial.weight ?? 0} required {...errorAttributes("weight", state)} /><select name="weight_unit" aria-label="Weight unit" defaultValue={initial.weight_unit ?? "kg"}><option value="kg">kg</option><option value="lb">lb</option><option value="g">g</option><option value="oz">oz</option></select></div><ErrorText name="weight" state={state} /></div>
        </div>
        <div className="admin-field"><label htmlFor="package_description">Package description</label><textarea id="package_description" name="package_description" rows={3} defaultValue={initial.package_description ?? ""} required {...errorAttributes("package_description", state)} /><ErrorText name="package_description" state={state} /></div>
        <div className="admin-field"><label htmlFor="shipment_details">Additional shipment details</label><textarea id="shipment_details" name="shipment_details" rows={4} defaultValue={initial.shipment_details ?? ""} {...errorAttributes("shipment_details", state)} /><ErrorText name="shipment_details" state={state} /></div>
      </section>

      <div className="admin-form-grid admin-form-grid--2">
        <section className="admin-panel admin-form-section">
          <div className="admin-section-heading"><span><AdminIcon name="money" /></span><div><h2>Billing & value</h2><p>Commercial values shown on the invoice.</p></div></div>
          <div className="admin-form-grid admin-form-grid--2">
            <div className="admin-field"><label htmlFor="freight_price">Freight price</label><div className="admin-money-field"><span>$</span><input id="freight_price" name="freight_price" type="number" min="0" step="0.01" defaultValue={initial.freight_price ?? 0} {...errorAttributes("freight_price", state)} /></div><ErrorText name="freight_price" state={state} /></div>
            <div className="admin-field"><label htmlFor="insurance">Insurance</label><div className="admin-money-field"><span>$</span><input id="insurance" name="insurance" type="number" min="0" step="0.01" defaultValue={initial.insurance ?? 0} {...errorAttributes("insurance", state)} /></div><ErrorText name="insurance" state={state} /></div>
            <div className="admin-field"><label htmlFor="package_value">Declared package value</label><div className="admin-money-field"><span>$</span><input id="package_value" name="package_value" type="number" min="0" step="0.01" defaultValue={initial.package_value ?? 0} {...errorAttributes("package_value", state)} /></div><ErrorText name="package_value" state={state} /></div>
            <div className="admin-field"><label htmlFor="currency">Currency</label><select id="currency" name="currency" defaultValue={initial.currency ?? "USD"}><option value="USD">USD — US Dollar</option><option value="GBP">GBP — Pound Sterling</option><option value="EUR">EUR — Euro</option><option value="CAD">CAD — Canadian Dollar</option><option value="AUD">AUD — Australian Dollar</option><option value="NGN">NGN — Nigerian Naira</option></select></div>
            <div className="admin-field"><label htmlFor="payment_status">Payment status</label><select id="payment_status" name="payment_status" defaultValue={initial.payment_status ?? "unpaid"}><option value="unpaid">Unpaid</option><option value="partial">Partially paid</option><option value="paid">Paid</option><option value="refunded">Refunded</option></select></div>
            <div className="admin-field"><label htmlFor="billing_status">Billing status</label><select id="billing_status" name="billing_status" defaultValue={initial.billing_status ?? "unpaid"}><option value="unpaid">Unpaid</option><option value="partial">Partially paid</option><option value="paid">Paid</option><option value="waived">Waived</option></select></div>
          </div>
        </section>
        <section className="admin-panel admin-form-section">
          <div className="admin-section-heading"><span><AdminIcon name="document" /></span><div><h2>Cargo image & visibility</h2><p>Private proof image and customer-facing controls.</p></div></div>
          <div className="admin-field"><label htmlFor="cargo_image">Cargo image</label><label className="admin-file-drop" htmlFor="cargo_image"><AdminIcon name="plus" /><span><strong>Choose an image</strong><small>JPEG, PNG or WebP · 5 MB maximum</small></span></label><input className="admin-file-input" id="cargo_image" name="cargo_image" type="file" accept="image/jpeg,image/png,image/webp" {...errorAttributes("cargo_image", state)} /><ErrorText name="cargo_image" state={state} /></div>
          {initial.cargo_image_path && <label className="admin-check"><input type="checkbox" name="remove_cargo_image" /><span><strong>Remove current cargo image</strong><small>A new upload always replaces it.</small></span></label>}
          <div className="admin-toggle-list">
            <label className="admin-check"><input type="checkbox" name="is_delivered" defaultChecked={Boolean(initial.is_delivered)} /><span><strong>Delivered</strong><small>Mark the shipment as completed.</small></span></label>
            <label className="admin-check"><input type="checkbox" name="show_billing" defaultChecked={Boolean(initial.show_billing)} /><span><strong>Show billing publicly</strong><small>Display permitted charges on the tracking page.</small></span></label>
          </div>
        </section>
      </div>
      <div className="admin-sticky-actions">
        <Link href={shipmentId ? `/admin/shipments/${shipmentId}` : "/admin/shipments"} className="admin-button admin-button--secondary">Cancel</Link>
        <SubmitButton pendingLabel={mode === "create" ? "Creating shipment…" : "Saving changes…"}>{mode === "create" ? "Create shipment" : "Save changes"}</SubmitButton>
      </div>
    </form>
  );
}
