import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/service";
import { parsePublicChatMessage, parsePublicChatMessagesResult } from "@/lib/types";

export const dynamic = "force-dynamic";

const trackingNumberParam = z
  .string()
  .trim()
  .toUpperCase()
  .min(4)
  .max(64)
  .regex(/^[A-Z0-9][A-Z0-9-]{3,63}$/);

const sendBodySchema = z.object({
  body: z.string().trim().min(1, "Enter a message.").max(2000, "Keep messages under 2,000 characters."),
});

export async function GET(_request: Request, { params }: { params: Promise<{ trackingNumber: string }> }) {
  const { trackingNumber } = await params;
  const parsedNumber = trackingNumberParam.safeParse(trackingNumber);
  if (!parsedNumber.success) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const supabase = createServiceClient();
  if (!supabase) return NextResponse.json({ error: "unavailable" }, { status: 503 });

  try {
    const { data, error } = await supabase.rpc("get_shipment_chat_messages", {
      p_tracking_number: parsedNumber.data,
    });
    if (error) {
      console.error("Chat lookup failed:", error.message);
      return NextResponse.json({ error: "unavailable" }, { status: 503 });
    }
    if (data === null || data === undefined) return NextResponse.json({ error: "not_found" }, { status: 404 });
    const result = parsePublicChatMessagesResult(data);
    if (!result) {
      console.error("Chat lookup returned an unexpected response shape.");
      return NextResponse.json({ error: "unavailable" }, { status: 503 });
    }
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Chat service unavailable:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ trackingNumber: string }> }) {
  const { trackingNumber } = await params;
  const parsedNumber = trackingNumberParam.safeParse(trackingNumber);
  if (!parsedNumber.success) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const json = await request.json().catch(() => null);
  const parsedBody = sendBodySchema.safeParse(json);
  if (!parsedBody.success) {
    return NextResponse.json(
      { error: "invalid_body", message: parsedBody.error.issues[0]?.message ?? "Enter a message." },
      { status: 400 },
    );
  }

  const supabase = createServiceClient();
  if (!supabase) return NextResponse.json({ error: "unavailable" }, { status: 503 });

  try {
    const { data, error } = await supabase.rpc("send_shipment_chat_message", {
      p_tracking_number: parsedNumber.data,
      p_body: parsedBody.data.body,
    });
    if (error) {
      if (error.code === "P0001") {
        return NextResponse.json({ error: "rate_limited", message: error.message }, { status: 429 });
      }
      if (error.code === "22023") {
        return NextResponse.json({ error: "invalid_body", message: error.message }, { status: 400 });
      }
      console.error("Chat send failed:", error.message);
      return NextResponse.json(
        { error: "unavailable", message: "Message could not be sent. Please try again." },
        { status: 500 },
      );
    }
    if (data === null || data === undefined) return NextResponse.json({ error: "not_found" }, { status: 404 });
    const message = parsePublicChatMessage(data);
    if (!message) {
      console.error("Chat send returned an unexpected response shape.");
      return NextResponse.json({ error: "unavailable" }, { status: 503 });
    }
    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error("Chat service unavailable:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
}
