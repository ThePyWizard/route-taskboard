import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { PROFILE_COOKIE } from "@/lib/constants";
import type { Profile } from "@/lib/types";

export { PROFILE_COOKIE };

// Resolve the current profile from the cookie (or null if none / deleted).
export async function getProfile(): Promise<Profile | null> {
  const jar = await cookies();
  const id = jar.get(PROFILE_COOKIE)?.value;
  if (!id) return null;

  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return (data as Profile) ?? null;
}

// For protected pages: bounce to /join if there is no valid profile.
export async function requireProfile(): Promise<Profile> {
  const profile = await getProfile();
  if (!profile) redirect("/join");
  return profile;
}
