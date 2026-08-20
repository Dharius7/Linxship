import { NextResponse } from "next/server";
import { getSupabaseServiceConfig } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

export function GET() {
  const supabase = getSupabaseServiceConfig();
  return NextResponse.json(
    {
      status: "ok",
      service: "lion-gold-shipping",
      databaseConfigured: supabase.isConfigured,
      timestamp: new Date().toISOString(),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
