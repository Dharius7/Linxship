import type { NextConfig } from "next";

const supabaseRemotePatterns: NonNullable<NonNullable<NextConfig["images"]>["remotePatterns"]> = [];
const configuredSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();

if (configuredSupabaseUrl) {
  try {
    const url = new URL(configuredSupabaseUrl);
    if (url.protocol === "https:" || url.protocol === "http:") {
      supabaseRemotePatterns.push({
        protocol: url.protocol.slice(0, -1) as "http" | "https",
        hostname: url.hostname,
        port: url.port,
        pathname: "/storage/v1/object/sign/shipment-images/**",
      });
    }
  } catch {
    // Supabase configuration is validated at runtime with a user-facing message.
  }
}

const nextConfig: NextConfig = {
  agentRules: false,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: supabaseRemotePatterns,
  },
  poweredByHeader: false,
  experimental: {
    serverActions: {
      bodySizeLimit: "6mb",
    },
  },
  async redirects() {
    return [
      { source: "/index.html", destination: "/", permanent: true },
      {
        source: "/order-details.php",
        has: [{ type: "query", key: "trackingcode", value: "(?<tracking>.+)" }],
        destination: "/track?number=:tracking",
        permanent: false,
      },
      {
        source: "/controllers/tracking_exec.php",
        has: [{ type: "query", key: "trackingcode", value: "(?<tracking>.+)" }],
        destination: "/track?number=:tracking",
        permanent: false,
      },
      { source: "/order-details.php", destination: "/track", permanent: false },
      { source: "/controllers/tracking_exec.php", destination: "/track", permanent: false },
      { source: "/newadmin/login.php", destination: "/admin/login", permanent: true },
      { source: "/newadmin/index.php", destination: "/admin", permanent: true },
      { source: "/newadmin/allclient.php", destination: "/admin/shipments", permanent: true },
      { source: "/newadmin/addshipping.php", destination: "/admin/shipments/new", permanent: true },
      { source: "/newadmin/addtrackinginfo.php", destination: "/admin/shipments", permanent: true },
      { source: "/newadmin/addmessage.php", destination: "/admin/shipments", permanent: true },
      { source: "/newadmin/addstatus.php", destination: "/admin/statuses", permanent: true },
      { source: "/newadmin/contactmessages.php", destination: "/admin/contacts", permanent: true },
      { source: "/newadmin/activitylog.php", destination: "/admin/activity", permanent: true },
    ];
  },
  async headers() {
    const securityHeaders = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
    ];

    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/admin/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }] },
      { source: "/track/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }] },
    ];
  },
};

export default nextConfig;
