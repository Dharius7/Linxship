import { z } from "zod";

const optionalEmail = z
  .string()
  .trim()
  .max(254, "Email must be 254 characters or fewer.")
  .refine((value) => value === "" || z.string().email().safeParse(value).success, {
    message: "Enter a valid email address.",
  });

const money = z.coerce
  .number({ message: "Enter a valid amount." })
  .finite()
  .min(0, "Amount cannot be negative.")
  .max(999_999_999_999, "Amount is too large.");

const optionalDate = z
  .string()
  .trim()
  .refine((value) => value === "" || /^\d{4}-\d{2}-\d{2}$/.test(value), {
    message: "Enter a valid date.",
  });

const requiredDate = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date.");

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password.").max(200),
});

export const shipmentSchema = z.object({
  tracking_number: z
    .string()
    .trim()
    .toUpperCase()
    .min(4, "Tracking number must be at least 4 characters.")
    .max(64)
    .regex(/^[A-Z0-9][A-Z0-9-]+$/, "Use only letters, numbers, and hyphens."),
  sender_name: z.string().trim().min(2, "Sender name is required.").max(160),
  sender_phone: z.string().trim().max(40),
  sender_email: optionalEmail,
  sender_address: z.string().trim().min(5, "Sender address is required.").max(1000),
  recipient_name: z.string().trim().min(2, "Recipient name is required.").max(160),
  recipient_phone: z.string().trim().max(40),
  recipient_email: optionalEmail,
  recipient_address: z.string().trim().min(5, "Recipient address is required.").max(1000),
  payment_status: z.enum(["unpaid", "paid", "partial", "refunded"]),
  service_type: z.string().trim().min(2, "Service type is required.").max(100),
  office_of_origin: z.string().trim().min(2, "Origin is required.").max(190),
  destination: z.string().trim().min(2, "Destination is required.").max(190),
  insurance: money,
  quantity: z.coerce.number().int().min(1).max(1_000_000),
  weight: z.coerce.number().finite().min(0).max(999_999_999),
  freight_price: money,
  package_value: money,
  currency: z.string().trim().toUpperCase().regex(/^[A-Z]{3}$/, "Use a 3-letter currency code."),
  weight_unit: z.enum(["kg", "lb", "g", "oz"]),
  package_description: z.string().trim().min(2, "Package description is required.").max(1000),
  billing_status: z.enum(["unpaid", "paid", "partial", "waived"]),
  collection_date: requiredDate,
  delivery_date: optionalDate,
  shipment_details: z.string().trim().max(5000),
  current_status: z.string().trim().min(2, "Current status is required.").max(100),
  is_delivered: z.boolean(),
  show_billing: z.boolean(),
}).superRefine((value, context) => {
  if (value.delivery_date && value.collection_date && value.delivery_date < value.collection_date) {
    context.addIssue({
      code: "custom",
      path: ["delivery_date"],
      message: "Delivery date cannot be before the collection date.",
    });
  }
});

export const trackingEventSchema = z.object({
  status: z.string().trim().min(2, "Status is required.").max(100),
  location: z.string().trim().min(2, "Location is required.").max(190),
  event_time: z
    .string()
    .trim()
    .min(1, "Event date and time are required.")
    .refine((value) => !Number.isNaN(Date.parse(`${value}Z`)), "Enter a valid UTC date and time."),
  requires_payment: z.boolean(),
  billing_amount: money,
});

export const shipmentMessageSchema = z.object({
  message: z.string().trim().min(2, "Message is required.").max(4000),
});

export const statusSchema = z.object({
  name: z.string().trim().min(2, "Status name is required.").max(64),
  sort_order: z.coerce.number().int().min(0).max(10_000),
  is_terminal: z.boolean(),
});

export type ShipmentInput = z.infer<typeof shipmentSchema>;
export type TrackingEventInput = z.infer<typeof trackingEventSchema>;
