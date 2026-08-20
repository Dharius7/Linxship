import { createClient } from "@supabase/supabase-js";

const [rawEmail, rawDisplayName] = process.argv.slice(2);
const email = rawEmail?.trim().toLowerCase();
const displayName = rawDisplayName?.trim();

if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error('Usage: npm run admin:bootstrap -- admin@example.com "Admin Name"');
  process.exitCode = 1;
} else if (displayName && (displayName.length < 2 || displayName.length > 120)) {
  console.error("The display name must contain between 2 and 120 characters.");
  process.exitCode = 1;
} else {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const secretKey =
    process.env.SUPABASE_SECRET_KEY?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !secretKey) {
    console.error(
      "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY in .env.local before bootstrapping an administrator.",
    );
    process.exitCode = 1;
  } else {
    const supabase = createClient(url, secretKey, {
      auth: { autoRefreshToken: false, detectSessionInUrl: false, persistSession: false },
    });

    const pageSize = 200;
    let page = 1;
    let user;

    while (!user) {
      const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: pageSize });
      if (error) {
        console.error(`Unable to read Supabase Auth users: ${error.message}`);
        process.exitCode = 1;
        break;
      }

      user = data.users.find((candidate) => candidate.email?.toLowerCase() === email);
      if (user || data.users.length < pageSize) break;
      page += 1;
    }

    if (!process.exitCode && !user) {
      console.error(
        `No Supabase Auth user exists for ${email}. Create or invite that user in the Supabase dashboard first.`,
      );
      process.exitCode = 1;
    }

    if (!process.exitCode && user) {
      const fallbackName =
        typeof user.user_metadata?.display_name === "string"
          ? user.user_metadata.display_name.trim()
          : "";
      const nameCandidate = displayName || fallbackName;
      const resolvedName =
        nameCandidate.length >= 2 ? nameCandidate.slice(0, 120) : "Administrator";

      const { error } = await supabase.from("admin_profiles").upsert(
        {
          user_id: user.id,
          display_name: resolvedName,
          is_active: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );

      if (error) {
        console.error(`Unable to activate the administrator profile: ${error.message}`);
        process.exitCode = 1;
      } else {
        console.log(`Administrator access activated for ${email}.`);
      }
    }
  }
}
