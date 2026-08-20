"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/types/database";

import { getSupabaseConfig } from "./config";

let browserClient: SupabaseClient<Database> | undefined;

/** Create (and reuse) the browser Supabase client. */
export function createClient(): SupabaseClient<Database> {
  if (!browserClient) {
    const { url, publishableKey } = getSupabaseConfig();
    browserClient = createBrowserClient<Database>(url, publishableKey);
  }

  return browserClient;
}

export const createBrowserSupabaseClient = createClient;

