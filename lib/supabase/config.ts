const LOCAL_SUPABASE_URL = "http://127.0.0.1:54321";
const UNCONFIGURED_PUBLIC_KEY = "supabase-public-key-not-configured";

export type SupabasePublicConfig = {
  /** Safe URL passed to the SDK. Check `isConfigured` before making requests. */
  url: string;
  /** Supports Supabase's current publishable key and the legacy anon key. */
  publishableKey: string;
  isConfigured: boolean;
  missingVariables: string[];
};

function validHttpUrl(value: string | undefined): value is string {
  if (!value) return false;

  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

/**
 * Read only NEXT_PUBLIC values so this helper is safe in both client and server
 * modules. Placeholder values stop static builds from crashing before env setup.
 */
export function getSupabaseConfig(): SupabasePublicConfig {
  const configuredUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const configuredKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  const missingVariables: string[] = [];

  if (!validHttpUrl(configuredUrl)) {
    missingVariables.push("NEXT_PUBLIC_SUPABASE_URL");
  }
  if (!configuredKey) {
    missingVariables.push(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)",
    );
  }

  return {
    url: validHttpUrl(configuredUrl) ? configuredUrl : LOCAL_SUPABASE_URL,
    publishableKey: configuredKey || UNCONFIGURED_PUBLIC_KEY,
    isConfigured: missingVariables.length === 0,
    missingVariables,
  };
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseConfig().isConfigured;
}

export function getSupabaseSetupMessage(): string | null {
  const config = getSupabaseConfig();
  if (config.isConfigured) return null;

  return `Supabase is not configured. Set ${config.missingVariables.join(" and ")}.`;
}

