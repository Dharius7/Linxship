import { redirect } from "next/navigation";
import { AdminNav } from "@/components/admin/admin-nav";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  if (!isSupabaseConfigured()) redirect("/admin/login");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const { data: profile } = await supabase
    .from("admin_profiles")
    .select("display_name,is_active")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!profile?.is_active) {
    redirect("/admin/login");
  }

  return (
    <div className="admin-app-shell">
      <a className="admin-skip-link" href="#admin-main-content">Skip to main content</a>
      <AdminNav displayName={profile.display_name || "Administrator"} email={user.email || "Admin account"} />
      <main className="admin-main" id="admin-main-content" tabIndex={-1}><div className="admin-main-inner">{children}</div></main>
    </div>
  );
}
