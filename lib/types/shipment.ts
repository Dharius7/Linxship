import type { Tables, TablesInsert, TablesUpdate } from "./database";
import { z } from "zod";

export type AdminProfile = Tables<"admin_profiles">;
export type Shipment = Tables<"shipments">;
export type ShipmentInsert = TablesInsert<"shipments">;
export type ShipmentUpdate = TablesUpdate<"shipments">;
export type ShipmentStatus = Tables<"shipment_statuses">;
export type TrackingEvent = Tables<"tracking_events">;
export type ShipmentMessage = Tables<"shipment_messages">;
export type ShipmentChatMessage = Tables<"shipment_chat_messages">;
export type ContactMessage = Tables<"contact_messages">;
export type ActivityLog = Tables<"activity_logs">;

const trackingNumberSchema = z
  .string()
  .min(4)
  .max(64)
  .regex(/^[A-Z0-9][A-Z0-9-]{3,63}$/);

const calendarDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const date = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  });

// PostgreSQL timestamptz JSON uses an ISO offset and may include microseconds.
const timestampSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})$/)
  .refine((value) => !Number.isNaN(Date.parse(value)));

const amountSchema = z.number().finite().min(0).max(999_999_999_999.99);
const paymentStatusSchema = z.enum(["paid", "unpaid", "partial", "refunded"]);
const billingStatusSchema = z.enum(["paid", "unpaid", "partial", "waived"]);
const cargoImagePathSchema = z
  .string()
  .max(512)
  .regex(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\/[a-z0-9][a-z0-9._-]{0,127}\.(?:jpe?g|png|webp)$/i,
  );

const publicShipmentCommon = {
  tracking_number: trackingNumberSchema,
  sender_name: z.string().min(1).max(160),
  sender_phone: z.null(),
  sender_address: z.string().min(1).max(1000),
  sender_email: z.null(),
  recipient_name: z.string().min(1).max(160),
  recipient_phone: z.null(),
  recipient_address: z.string().min(1).max(1000),
  recipient_email: z.null(),
  service_type: z.string().min(2).max(100),
  office_of_origin: z.string().min(2).max(190),
  destination: z.string().min(2).max(190),
  currency: z.string().regex(/^[A-Z]{3}$/),
  quantity: z.number().int().min(1).max(1_000_000),
  weight: amountSchema,
  weight_unit: z.string().min(1).max(16),
  package_description: z.string().min(2).max(1000),
  collection_date: calendarDateSchema,
  delivery_date: calendarDateSchema.nullable(),
  current_status: z.string().min(2).max(100),
  is_delivered: z.boolean(),
  /** Private Storage object path; exchange server-side for a signed URL. */
  cargo_image_path: cargoImagePathSchema.nullable(),
  has_cargo_image: z.boolean(),
  created_at: timestampSchema,
  updated_at: timestampSchema,
};

const visiblePublicShipmentSchema = z.object({
  ...publicShipmentCommon,
  show_billing: z.literal(true),
  payment_status: paymentStatusSchema,
  insurance: amountSchema,
  freight_price: amountSchema,
  package_value: amountSchema,
  billing_status: billingStatusSchema,
}).strict();

const hiddenPublicShipmentSchema = z.object({
  ...publicShipmentCommon,
  show_billing: z.literal(false),
  payment_status: z.null(),
  insurance: z.null(),
  freight_price: z.null(),
  package_value: z.null(),
  billing_status: z.null(),
}).strict();

export const publicTrackingShipmentSchema = z
  .discriminatedUnion("show_billing", [
    visiblePublicShipmentSchema,
    hiddenPublicShipmentSchema,
  ])
  .superRefine((shipment, context) => {
    if (shipment.delivery_date && shipment.delivery_date < shipment.collection_date) {
      context.addIssue({
        code: "custom",
        path: ["delivery_date"],
        message: "Delivery date precedes collection date.",
      });
    }
    if (shipment.has_cargo_image !== (shipment.cargo_image_path !== null)) {
      context.addIssue({
        code: "custom",
        path: ["has_cargo_image"],
        message: "Cargo image flag and path do not agree.",
      });
    }
  });

export const publicTrackingEventSchema = z.object({
  id: z.uuid(),
  status: z.string().min(2).max(100),
  location: z.string().min(2).max(190),
  event_time: timestampSchema,
  requires_payment: z.boolean(),
  billing_amount: amountSchema.nullable(),
  created_at: timestampSchema,
}).strict().superRefine((event, context) => {
  if (!event.requires_payment && event.billing_amount !== null && event.billing_amount !== 0) {
    context.addIssue({
      code: "custom",
      path: ["billing_amount"],
      message: "A non-payment event cannot carry a billing amount.",
    });
  }
});

export const publicShipmentMessageSchema = z.object({
  id: z.uuid(),
  message: z.string().min(1).max(4000),
  created_at: timestampSchema,
}).strict();

/**
 * The complete curated JSON payload returned by the `track_shipment` RPC.
 * A tracking event's payment-required amount is independent of the
 * shipment's general `show_billing` flag: it is present exactly when that
 * event's `requires_payment` is true (enforced in `publicTrackingEventSchema`).
 */
export const publicTrackingResultSchema = z.object({
  shipment: publicTrackingShipmentSchema,
  events: z.array(publicTrackingEventSchema).max(250),
  messages: z.array(publicShipmentMessageSchema).max(100),
}).strict();

export type PublicTrackingShipment = z.infer<typeof publicTrackingShipmentSchema>;
export type PublicTrackingEvent = z.infer<typeof publicTrackingEventSchema>;
export type PublicShipmentMessage = z.infer<typeof publicShipmentMessageSchema>;
export type PublicTrackingResult = z.infer<typeof publicTrackingResultSchema>;

/** Parse untrusted RPC JSON without allowing partial or coerced values through. */
export function parsePublicTrackingResult(value: unknown): PublicTrackingResult | null {
  const parsed = publicTrackingResultSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export function isPublicTrackingResult(value: unknown): value is PublicTrackingResult {
  return publicTrackingResultSchema.safeParse(value).success;
}

/**
 * The live-chat payload never carries sender_display_name or created_by -
 * those columns aren't selected by the RPCs, so an admin's real identity
 * can't leak to the public side even if the rendering logic had a bug.
 */
export const publicChatMessageSchema = z.object({
  id: z.uuid(),
  sender_role: z.enum(["customer", "admin"]),
  body: z.string().min(1).max(2000),
  created_at: timestampSchema,
}).strict();

export const publicChatMessagesResultSchema = z.object({
  messages: z.array(publicChatMessageSchema).max(200),
}).strict();

export type PublicChatMessage = z.infer<typeof publicChatMessageSchema>;
export type PublicChatMessagesResult = z.infer<typeof publicChatMessagesResultSchema>;

export function parsePublicChatMessagesResult(value: unknown): PublicChatMessagesResult | null {
  const parsed = publicChatMessagesResultSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export function parsePublicChatMessage(value: unknown): PublicChatMessage | null {
  const parsed = publicChatMessageSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}
