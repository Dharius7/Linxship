import "server-only";

import { createServiceClient } from "./service";

export const SHIPMENT_IMAGES_BUCKET = "shipment-images";

const SHIPMENT_IMAGE_PATH =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\/[a-z0-9][a-z0-9._-]{0,127}\.(?:jpe?g|png|webp)$/i;

/**
 * Exchange the private object path returned by a successful tracking lookup for
 * a short-lived URL. Returns null if env setup, validation, or signing fails.
 */
export async function createShipmentImageSignedUrl(
  objectPath: string | null | undefined,
  expiresInSeconds = 300,
): Promise<string | null> {
  if (!objectPath || !SHIPMENT_IMAGE_PATH.test(objectPath)) return null;

  const serviceClient = createServiceClient();
  if (!serviceClient) return null;

  const safeExpiry = Math.min(900, Math.max(60, Math.floor(expiresInSeconds)));
  const { data, error } = await serviceClient.storage
    .from(SHIPMENT_IMAGES_BUCKET)
    .createSignedUrl(objectPath, safeExpiry);

  if (error) return null;
  return data.signedUrl;
}

