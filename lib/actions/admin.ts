"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseSetupMessage, isSupabaseConfigured } from "@/lib/supabase/config";
import {
  chatMessageSchema,
  loginSchema,
  shipmentMessageSchema,
  shipmentSchema,
  statusSchema,
  trackingEventSchema,
} from "@/lib/validation/admin";

export type AdminActionState = {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors?: Record<string, string>;
  redirectTo?: string;
};

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

function resultError(message: string, fieldErrors?: Record<string, string>): AdminActionState {
  return { status: "error", message, fieldErrors };
}

function schemaErrors(issues: ReadonlyArray<{ path: PropertyKey[]; message: string }>) {
  const errors: Record<string, string> = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? "form");
    errors[key] ??= issue.message;
  }
  return errors;
}

function databaseMessage(error: { code?: string; message?: string } | null, fallback: string) {
  if (error?.code === "23505") return "That value is already in use.";
  if (error?.code === "23503") return "This record is still used elsewhere and cannot be changed.";
  return fallback;
}

function nullable(value: string) {
  return value === "" ? null : value;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function noticePath(path: string, kind: "success" | "error", message: string) {
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}${kind}=${encodeURIComponent(message)}`;
}

async function requireActor(): Promise<
  | { supabase: SupabaseServerClient; userId: string; displayName: string }
  | null
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("admin_profiles")
    .select("display_name,is_active")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile?.is_active) return null;
  return {
    supabase,
    userId: user.id,
    displayName: profile.display_name || user.email || "Administrator",
  };
}

function shipmentFormData(formData: FormData) {
  return {
    tracking_number: String(formData.get("tracking_number") ?? ""),
    sender_name: String(formData.get("sender_name") ?? ""),
    sender_phone: String(formData.get("sender_phone") ?? ""),
    sender_email: String(formData.get("sender_email") ?? ""),
    sender_address: String(formData.get("sender_address") ?? ""),
    recipient_name: String(formData.get("recipient_name") ?? ""),
    recipient_phone: String(formData.get("recipient_phone") ?? ""),
    recipient_email: String(formData.get("recipient_email") ?? ""),
    recipient_address: String(formData.get("recipient_address") ?? ""),
    payment_status: String(formData.get("payment_status") ?? "unpaid"),
    service_type: String(formData.get("service_type") ?? ""),
    office_of_origin: String(formData.get("office_of_origin") ?? ""),
    destination: String(formData.get("destination") ?? ""),
    insurance: formData.get("insurance") ?? 0,
    quantity: formData.get("quantity") ?? 1,
    weight: formData.get("weight") ?? 0,
    freight_price: formData.get("freight_price") ?? 0,
    package_value: formData.get("package_value") ?? 0,
    currency: String(formData.get("currency") ?? "USD"),
    weight_unit: String(formData.get("weight_unit") ?? "kg"),
    package_description: String(formData.get("package_description") ?? ""),
    billing_status: String(formData.get("billing_status") ?? "unpaid"),
    collection_date: String(formData.get("collection_date") ?? ""),
    delivery_date: String(formData.get("delivery_date") ?? ""),
    shipment_details: String(formData.get("shipment_details") ?? ""),
    current_status: String(formData.get("current_status") ?? "Pending"),
    is_delivered: formData.get("is_delivered") === "on",
    show_billing: formData.get("show_billing") === "on",
  };
}

type CargoUpload = { path: string | null; error: string | null };

async function uploadCargoImage(
  supabase: SupabaseServerClient,
  shipmentId: string,
  formData: FormData,
): Promise<CargoUpload> {
  const value = formData.get("cargo_image");
  if (!(value instanceof File) || value.size === 0) return { path: null, error: null };
  const extensions: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };
  const extension = extensions[value.type];
  if (!extension) return { path: null, error: "Cargo image must be a JPEG, PNG, or WebP file." };
  if (value.size > 5 * 1024 * 1024) {
    return { path: null, error: "Cargo image must be 5 MB or smaller." };
  }

  const bytes = new Uint8Array(await value.slice(0, 12).arrayBuffer());
  const isJpeg = value.type === "image/jpeg" && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const isPng = value.type === "image/png"
    && [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((byte, index) => bytes[index] === byte);
  const isWebp = value.type === "image/webp"
    && String.fromCharCode(...bytes.slice(0, 4)) === "RIFF"
    && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  if (!isJpeg && !isPng && !isWebp) {
    return { path: null, error: "The selected file does not contain a valid JPEG, PNG, or WebP image." };
  }

  const path = `${shipmentId}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from("shipment-images").upload(path, value, {
    contentType: value.type,
    cacheControl: "3600",
    upsert: false,
  });
  return error
    ? { path: null, error: "The cargo image could not be uploaded. Please try again." }
    : { path, error: null };
}

async function removeCargoImage(supabase: SupabaseServerClient, path: string | null) {
  if (!path) return;
  const { error } = await supabase.storage.from("shipment-images").remove([path]);
  if (error) console.error("Unable to remove cargo image", error.message);
}

async function syncShipmentToLatestEvent(
  supabase: SupabaseServerClient,
  userId: string,
  shipmentId: string,
  useFallbackWhenEmpty = true,
) {
  const { data: latest } = await supabase
    .from("tracking_events")
    .select("status")
    .eq("shipment_id", shipmentId)
    .order("event_time", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!latest && !useFallbackWhenEmpty) return;
  const fallback = latest
    ? null
    : (await supabase
        .from("shipment_statuses")
        .select("name")
        .order("sort_order")
        .order("name")
        .limit(1)
        .maybeSingle()).data;
  const status = latest?.status || fallback?.name || "Pending";
  const { data: catalogStatus } = await supabase
    .from("shipment_statuses")
    .select("slug")
    .eq("slug", slugify(status))
    .maybeSingle();
  await supabase
    .from("shipments")
    .update({
      current_status: status,
      is_delivered: catalogStatus?.slug === "delivered" || status.trim().toLowerCase() === "delivered",
      updated_by: userId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", shipmentId);
}

export async function loginAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const values = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!values.success) {
    return resultError("Check the highlighted fields.", schemaErrors(values.error.issues));
  }

  if (!isSupabaseConfigured()) {
    return resultError(getSupabaseSetupMessage() || "Supabase is not configured for this environment.");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(values.data);
  if (error || !data.user) return resultError("Email or password is incorrect.");

  const { data: profile } = await supabase
    .from("admin_profiles")
    .select("is_active")
    .eq("user_id", data.user.id)
    .maybeSingle();
  if (!profile?.is_active) {
    await supabase.auth.signOut();
    return resultError("This account does not have active administrator access.");
  }

  revalidatePath("/admin", "layout");
  return { status: "success", message: "Signed in. Opening your dashboard…", redirectTo: "/admin" };
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/admin", "layout");
  redirect("/admin/login");
}

export async function createShipmentAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const actor = await requireActor();
  if (!actor) return resultError("Your session has expired. Sign in again.");
  const result = shipmentSchema.safeParse(shipmentFormData(formData));
  if (!result.success) return resultError("Check the highlighted fields.", schemaErrors(result.error.issues));

  const id = crypto.randomUUID();
  const input = result.data;
  const { error } = await actor.supabase.from("shipments").insert({
    id,
    ...input,
    sender_phone: nullable(input.sender_phone),
    sender_email: nullable(input.sender_email),
    recipient_phone: nullable(input.recipient_phone),
    recipient_email: nullable(input.recipient_email),
    collection_date: input.collection_date,
    delivery_date: nullable(input.delivery_date),
    shipment_details: nullable(input.shipment_details),
    cargo_image_path: null,
    created_by: actor.userId,
    updated_by: actor.userId,
  });
  if (error) {
    return resultError(databaseMessage(error, "Shipment could not be created."));
  }

  const image = await uploadCargoImage(actor.supabase, id, formData);
  if (image.error) {
    await actor.supabase.from("shipments").delete().eq("id", id);
    return resultError(image.error, { cargo_image: image.error });
  }
  if (image.path) {
    const { error: imageUpdateError } = await actor.supabase
      .from("shipments")
      .update({ cargo_image_path: image.path, updated_by: actor.userId })
      .eq("id", id);
    if (imageUpdateError) {
      await removeCargoImage(actor.supabase, image.path);
      await actor.supabase.from("shipments").delete().eq("id", id);
      return resultError("The cargo image could not be attached, so the shipment was not created.");
    }
  }

  revalidatePath("/admin");
  revalidatePath("/admin/shipments");
  return {
    status: "success",
    message: "Shipment created successfully.",
    redirectTo: `/admin/shipments/${id}`,
  };
}

export async function updateShipmentAction(
  shipmentId: string,
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const actor = await requireActor();
  if (!actor) return resultError("Your session has expired. Sign in again.");
  const result = shipmentSchema.safeParse(shipmentFormData(formData));
  if (!result.success) return resultError("Check the highlighted fields.", schemaErrors(result.error.issues));

  const { data: existing, error: lookupError } = await actor.supabase
    .from("shipments")
    .select("cargo_image_path")
    .eq("id", shipmentId)
    .maybeSingle();
  if (lookupError || !existing) return resultError("Shipment could not be found.");

  const image = await uploadCargoImage(actor.supabase, shipmentId, formData);
  if (image.error) return resultError(image.error, { cargo_image: image.error });
  const removeExisting = formData.get("remove_cargo_image") === "on";
  const nextImage = image.path ?? (removeExisting ? null : existing.cargo_image_path);
  const input = result.data;
  const { error } = await actor.supabase
    .from("shipments")
    .update({
      ...input,
      sender_phone: nullable(input.sender_phone),
      sender_email: nullable(input.sender_email),
      recipient_phone: nullable(input.recipient_phone),
      recipient_email: nullable(input.recipient_email),
      collection_date: input.collection_date,
      delivery_date: nullable(input.delivery_date),
      shipment_details: nullable(input.shipment_details),
      cargo_image_path: nextImage,
      updated_by: actor.userId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", shipmentId);

  if (error) {
    await removeCargoImage(actor.supabase, image.path);
    return resultError(databaseMessage(error, "Shipment could not be updated."));
  }
  if ((image.path || removeExisting) && existing.cargo_image_path) {
    await removeCargoImage(actor.supabase, existing.cargo_image_path);
  }

  await syncShipmentToLatestEvent(actor.supabase, actor.userId, shipmentId, false);

  revalidatePath("/admin");
  revalidatePath("/admin/shipments");
  revalidatePath(`/admin/shipments/${shipmentId}`);
  return { status: "success", message: "Shipment changes saved." };
}

export async function deleteShipmentAction(shipmentId: string) {
  const actor = await requireActor();
  if (!actor) redirect("/admin/login");
  const { data: shipment } = await actor.supabase
    .from("shipments")
    .select("cargo_image_path")
    .eq("id", shipmentId)
    .maybeSingle();
  const { error } = await actor.supabase.from("shipments").delete().eq("id", shipmentId);
  if (error) redirect(noticePath("/admin/shipments", "error", "Shipment could not be deleted."));
  await removeCargoImage(actor.supabase, shipment?.cargo_image_path ?? null);
  revalidatePath("/admin");
  revalidatePath("/admin/shipments");
  redirect(noticePath("/admin/shipments", "success", "Shipment deleted."));
}

export async function addTrackingEventAction(
  shipmentId: string,
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const actor = await requireActor();
  if (!actor) return resultError("Your session has expired. Sign in again.");
  const result = trackingEventSchema.safeParse({
    status: formData.get("status"),
    location: formData.get("location"),
    event_time: formData.get("event_time"),
    requires_payment: formData.get("requires_payment") === "on",
    billing_amount: formData.get("billing_amount") ?? 0,
  });
  if (!result.success) return resultError("Check the highlighted fields.", schemaErrors(result.error.issues));
  const eventId = crypto.randomUUID();
  const event = result.data;
  const { error } = await actor.supabase.from("tracking_events").insert({
    id: eventId,
    shipment_id: shipmentId,
    ...event,
    event_time: new Date(`${event.event_time}Z`).toISOString(),
    created_by: actor.userId,
  });
  if (error) return resultError("Tracking event could not be added.");

  revalidatePath("/admin");
  revalidatePath(`/admin/shipments/${shipmentId}`);
  revalidatePath(`/admin/shipments/${shipmentId}/events`);
  return { status: "success", message: "Tracking event added." };
}

export async function updateTrackingEventAction(
  shipmentId: string,
  eventId: string,
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const actor = await requireActor();
  if (!actor) return resultError("Your session has expired. Sign in again.");
  const result = trackingEventSchema.safeParse({
    status: formData.get("status"),
    location: formData.get("location"),
    event_time: formData.get("event_time"),
    requires_payment: formData.get("requires_payment") === "on",
    billing_amount: formData.get("billing_amount") ?? 0,
  });
  if (!result.success) return resultError("Check the highlighted fields.", schemaErrors(result.error.issues));
  const event = result.data;
  const { error } = await actor.supabase
    .from("tracking_events")
    .update({ ...event, event_time: new Date(`${event.event_time}Z`).toISOString(), updated_by: actor.userId })
    .eq("id", eventId)
    .eq("shipment_id", shipmentId);
  if (error) return resultError("Tracking event could not be updated.");
  revalidatePath(`/admin/shipments/${shipmentId}`);
  revalidatePath(`/admin/shipments/${shipmentId}/events`);
  return { status: "success", message: "Tracking event updated." };
}

export async function deleteTrackingEventAction(
  shipmentId: string,
  eventId: string,
) {
  const actor = await requireActor();
  if (!actor) redirect("/admin/login");
  const { error } = await actor.supabase
    .from("tracking_events")
    .delete()
    .eq("id", eventId)
    .eq("shipment_id", shipmentId);
  if (error) {
    redirect(noticePath(`/admin/shipments/${shipmentId}/events`, "error", "Event could not be deleted."));
  }
  revalidatePath(`/admin/shipments/${shipmentId}`);
  revalidatePath(`/admin/shipments/${shipmentId}/events`);
  redirect(noticePath(`/admin/shipments/${shipmentId}/events`, "success", "Tracking event deleted."));
}

export async function addShipmentMessageAction(
  shipmentId: string,
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const actor = await requireActor();
  if (!actor) return resultError("Your session has expired. Sign in again.");
  const result = shipmentMessageSchema.safeParse({ message: formData.get("message") });
  if (!result.success) return resultError("Enter a message.", schemaErrors(result.error.issues));
  const id = crypto.randomUUID();
  const { error } = await actor.supabase.from("shipment_messages").insert({
    id,
    shipment_id: shipmentId,
    message: result.data.message,
    created_by: actor.userId,
  });
  if (error) return resultError("Message could not be added.");
  revalidatePath(`/admin/shipments/${shipmentId}`);
  revalidatePath(`/admin/shipments/${shipmentId}/messages`);
  return { status: "success", message: "Shipment message added." };
}

export async function updateShipmentMessageAction(
  shipmentId: string,
  messageId: string,
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const actor = await requireActor();
  if (!actor) return resultError("Your session has expired. Sign in again.");
  const result = shipmentMessageSchema.safeParse({ message: formData.get("message") });
  if (!result.success) return resultError("Enter a message.", schemaErrors(result.error.issues));
  const { error } = await actor.supabase
    .from("shipment_messages")
    .update({ message: result.data.message, updated_at: new Date().toISOString(), updated_by: actor.userId })
    .eq("id", messageId)
    .eq("shipment_id", shipmentId);
  if (error) return resultError("Message could not be updated.");
  revalidatePath(`/admin/shipments/${shipmentId}`);
  revalidatePath(`/admin/shipments/${shipmentId}/messages`);
  return { status: "success", message: "Shipment message updated." };
}

export async function deleteShipmentMessageAction(
  shipmentId: string,
  messageId: string,
) {
  const actor = await requireActor();
  if (!actor) redirect("/admin/login");
  const { error } = await actor.supabase
    .from("shipment_messages")
    .delete()
    .eq("id", messageId)
    .eq("shipment_id", shipmentId);
  if (error) {
    redirect(noticePath(`/admin/shipments/${shipmentId}/messages`, "error", "Message could not be deleted."));
  }
  revalidatePath(`/admin/shipments/${shipmentId}`);
  revalidatePath(`/admin/shipments/${shipmentId}/messages`);
  redirect(noticePath(`/admin/shipments/${shipmentId}/messages`, "success", "Message deleted."));
}

export async function sendAdminChatMessageAction(
  shipmentId: string,
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const actor = await requireActor();
  if (!actor) return resultError("Your session has expired. Sign in again.");
  const result = chatMessageSchema.safeParse({ body: formData.get("body") });
  if (!result.success) return resultError("Enter a message.", schemaErrors(result.error.issues));
  const { error } = await actor.supabase.from("shipment_chat_messages").insert({
    id: crypto.randomUUID(),
    shipment_id: shipmentId,
    sender_role: "admin",
    body: result.data.body,
  });
  if (error) return resultError("Message could not be sent.");
  revalidatePath(`/admin/shipments/${shipmentId}`);
  revalidatePath(`/admin/shipments/${shipmentId}/chat`);
  return { status: "success", message: "Message sent." };
}

export async function markShipmentChatReadAction(shipmentId: string): Promise<void> {
  const actor = await requireActor();
  if (!actor) return;
  await actor.supabase
    .from("shipment_chat_messages")
    .update({ is_read_by_admin: true })
    .eq("shipment_id", shipmentId)
    .eq("sender_role", "customer")
    .eq("is_read_by_admin", false);
  revalidatePath(`/admin/shipments/${shipmentId}`);
  revalidatePath("/admin/shipments");
}

export async function createStatusAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const actor = await requireActor();
  if (!actor) return resultError("Your session has expired. Sign in again.");
  const result = statusSchema.safeParse({
    name: formData.get("name"),
    sort_order: formData.get("sort_order") ?? 0,
    is_terminal: formData.get("is_terminal") === "on",
  });
  if (!result.success) return resultError("Check the status details.", schemaErrors(result.error.issues));
  const { error } = await actor.supabase.from("shipment_statuses").insert({
    name: result.data.name,
    slug: slugify(result.data.name),
    sort_order: result.data.sort_order,
    is_terminal: result.data.is_terminal,
    created_by: actor.userId,
    updated_by: actor.userId,
  });
  if (error) return resultError(databaseMessage(error, "Status could not be added."));
  revalidatePath("/admin/statuses");
  return { status: "success", message: "Status added." };
}

export async function deleteStatusAction(statusId: string) {
  const actor = await requireActor();
  if (!actor) redirect("/admin/login");
  const { error } = await actor.supabase.from("shipment_statuses").delete().eq("id", statusId);
  if (error) redirect(noticePath("/admin/statuses", "error", "Status could not be deleted."));
  revalidatePath("/admin/statuses");
  redirect(noticePath("/admin/statuses", "success", "Status removed."));
}

export async function markContactReadAction(contactId: string) {
  const actor = await requireActor();
  if (!actor) redirect("/admin/login");
  const { error } = await actor.supabase
    .from("contact_messages")
    .update({ is_read: true, read_at: new Date().toISOString(), read_by: actor.userId })
    .eq("id", contactId);
  if (error) redirect(noticePath("/admin/contacts", "error", "Message could not be updated."));
  revalidatePath("/admin");
  revalidatePath("/admin/contacts");
  redirect(noticePath("/admin/contacts", "success", "Message marked as read."));
}

export async function markContactUnreadAction(contactId: string) {
  const actor = await requireActor();
  if (!actor) redirect("/admin/login");
  const { error } = await actor.supabase
    .from("contact_messages")
    .update({ is_read: false, read_at: null, read_by: null })
    .eq("id", contactId);
  if (error) redirect(noticePath("/admin/contacts", "error", "Message could not be updated."));
  revalidatePath("/admin");
  revalidatePath("/admin/contacts");
  redirect(noticePath("/admin/contacts", "success", "Message marked as unread."));
}

export async function deleteContactAction(contactId: string) {
  const actor = await requireActor();
  if (!actor) redirect("/admin/login");
  const { error } = await actor.supabase.from("contact_messages").delete().eq("id", contactId);
  if (error) redirect(noticePath("/admin/contacts", "error", "Message could not be deleted."));
  revalidatePath("/admin");
  revalidatePath("/admin/contacts");
  redirect(noticePath("/admin/contacts", "success", "Contact message deleted."));
}
