import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import type { Database } from "@/lib/types/database";

import { getSupabaseConfig } from "./config";

const ADMIN_ROOT = "/admin";
const ADMIN_LOGIN = "/admin/login";
const ADMIN_PUBLIC_PREFIXES = [ADMIN_LOGIN, "/admin/auth"];

function copyResponseCookies(source: NextResponse, target: NextResponse) {
  source.cookies.getAll().forEach((cookie) => target.cookies.set(cookie));
  return target;
}

function isPublicAdminPath(pathname: string) {
  return ADMIN_PUBLIC_PREFIXES.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

/** Refresh Auth cookies and enforce the active admin allow-list. */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const config = getSupabaseConfig();

  // A missing local env should not make `next build` or the public site fail.
  // Admin pages can display the exported setup message with more context.
  if (!config.isConfigured) return response;

  const supabase = createServerClient<Database>(
    config.url,
    config.publishableKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const pathname = request.nextUrl.pathname;
  const protectsAdminPath =
    (pathname === ADMIN_ROOT || pathname.startsWith(`${ADMIN_ROOT}/`)) &&
    !isPublicAdminPath(pathname);

  // getUser validates the session with Supabase Auth; do not replace with the
  // locally decoded getSession result in request authorization code.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!protectsAdminPath) return response;

  if (!user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = ADMIN_LOGIN;
    loginUrl.search = "";
    loginUrl.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
    return copyResponseCookies(response, NextResponse.redirect(loginUrl));
  }

  const { data: profile } = await supabase
    .from("admin_profiles")
    .select("is_active")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile?.is_active) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = ADMIN_LOGIN;
    loginUrl.search = "";
    loginUrl.searchParams.set("error", "inactive");
    return copyResponseCookies(response, NextResponse.redirect(loginUrl));
  }

  return response;
}

