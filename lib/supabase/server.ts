import "server-only";

import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

import type { Database } from "@/lib/types/database";

import { getSupabaseConfig } from "./config";

/**
 * Create a request-scoped server client using the current getAll/setAll cookie
 * contract from `@supabase/ssr`. Server Components cannot always write cookies,
 * so failed writes are intentionally left for `proxy.ts` to refresh.
 */
export async function createClient(): Promise<SupabaseClient<Database>> {
  const cookieStore = await cookies();
  const { url, publishableKey } = getSupabaseConfig();

  return createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Cookie writes from Server Components are read-only in Next.js.
          // The root proxy refreshes the same session on the following request.
        }
      },
    },
  });
}

export const createServerSupabaseClient = createClient;

