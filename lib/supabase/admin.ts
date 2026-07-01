import { createClient } from "@supabase/supabase-js";

// Service-role client. BYPASSES row-level security. Server-only.
// Use ONLY inside server actions/route handlers that have already verified
// the caller is an admin (see requireAdmin in app/actions.ts).
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

export function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}
