import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/types/database";

import { getSupabaseConfig } from "./config";

export type SupabaseServiceConfig = {
  url: string;
  secretKey: string | null;
  isConfigured: boolean;
};

/**
 * Read the server-only Supabase secret. New projects use `sb_secret_...` keys;
 * `SUPABASE_SERVICE_ROLE_KEY` remains supported for existing projects.
 */
export function getSupabaseServiceConfig(): SupabaseServiceConfig {
  const publicConfig = getSupabaseConfig();
  const secretKey =
    process.env.SUPABASE_SECRET_KEY?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    null;

  return {
    url: publicConfig.url,
    secretKey,
    isConfigured: publicConfig.isConfigured && !!secretKey,
  };
}

/**
 * Create a privileged server client only when a server secret is configured.
 * Never import this module from a Client Component or expose its key to the UI.
 */
export function createServiceClient(): SupabaseClient<Database> | null {
  const config = getSupabaseServiceConfig();
  if (!config.isConfigured || !config.secretKey) return null;

  return createSupabaseClient<Database>(config.url, config.secretKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}

