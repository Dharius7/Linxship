import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/login-form";
import { AdminIcon } from "@/components/admin/icons";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseSetupMessage } from "@/lib/supabase/config";

export const metadata = { title: "Admin sign in" };

export default async function AdminLoginPage() {
  const setupMessage = getSupabaseSetupMessage();
  if (!setupMessage) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("admin_profiles")
        .select("is_active")
        .eq("user_id", user.id)
        .maybeSingle();
      if (profile?.is_active) redirect("/admin");
    }
  }

  return (
    <main className="admin-login-shell">
      <section className="admin-login-story">
        <div className="admin-login-story-inner">
          <Link href="/" className="admin-login-logo" aria-label="LinxShip home"><BrandLogo priority /></Link>
          <div className="admin-login-copy">
            <span className="admin-login-kicker">Operations command centre</span>
            <h1>Every shipment.<br />One clear view.</h1>
            <p>Manage consignments, customer updates, billing visibility, and delivery milestones from a secure workspace.</p>
            <div className="admin-login-points">
              <span><AdminIcon name="check" />Real-time shipment control</span>
              <span><AdminIcon name="check" />Private cargo documentation</span>
              <span><AdminIcon name="check" />Complete activity history</span>
            </div>
          </div>
          <small>© {new Date().getFullYear()} LinxShip Logistics & Storage</small>
        </div>
      </section>
      <section className="admin-login-panel">
        <div className="admin-login-card">
          <span className="admin-login-icon"><AdminIcon name="user" /></span>
          <span className="admin-eyebrow">Restricted access</span>
          <h2>Welcome back</h2>
          <p>Sign in with your administrator credentials to continue.</p>
          {setupMessage && <div className="admin-alert admin-alert--error" role="alert"><AdminIcon name="settings" /><span>{setupMessage}</span></div>}
          <LoginForm />
          <div className="admin-login-security"><AdminIcon name="check" /><span><strong>Protected by Supabase Auth</strong><small>Your session is encrypted and securely managed.</small></span></div>
          <Link href="/" className="admin-back-link">← Back to public website</Link>
        </div>
      </section>
    </main>
  );
}
