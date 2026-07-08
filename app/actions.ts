"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createAdminClient, adminEmails } from "@/lib/supabase/admin";
import { r2, R2_BUCKET } from "@/lib/r2";
import { getProfile, PROFILE_COOKIE } from "@/lib/session";
import type { SourceRoute } from "@/lib/types";

async function requireProfile() {
  const profile = await getProfile();
  if (!profile) throw new Error("No profile - please join first.");
  return profile;
}

async function requireAdmin() {
  const profile = await requireProfile();
  if (!profile.is_admin) throw new Error("Not an admin");
  return profile;
}

// ---------- profile / identity ----------

export async function createProfile(name: string, email: string) {
  const trimmed = name.trim();
  if (!trimmed) return { ok: false as const, error: "Please enter your name." };

  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail) return { ok: false as const, error: "Please enter your email." };
  // Basic shape check — this is a courtesy, not a security boundary.
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail))
    return { ok: false as const, error: "Please enter a valid email address." };

  const admin = createAdminClient();
  const isAdmin = adminEmails().includes(cleanEmail);

  const { data, error } = await admin
    .from("profiles")
    .insert({ name: trimmed, email: cleanEmail, is_admin: isAdmin })
    .select()
    .single();
  if (error) return { ok: false as const, error: error.message };

  await setProfileCookie(data.id);
  // Return id + name so the browser can remember this profile locally and offer
  // a one-tap "Continue as …" next time (see JoinForm) — without ever exposing
  // the full directory to other people.
  return { ok: true as const, profile: { id: data.id as string, name: data.name as string } };
}

// Reconnect a returning user whose cookie was cleared. We look them up by the
// email they typed rather than exposing the profile directory. Honor-system,
// like the rest of this no-auth app — not a security boundary.
export async function continueByEmail(email: string) {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail) return { ok: false as const, error: "Please enter your email." };

  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("id,name")
    .eq("email", cleanEmail)
    .order("created_at", { ascending: true })
    .limit(1);
  const profile = data?.[0];
  if (!profile) {
    return {
      ok: false as const,
      error: "No profile found for that email. Create one above.",
    };
  }

  await setProfileCookie(profile.id);
  return { ok: true as const, profile: { id: profile.id as string, name: profile.name as string } };
}

// Re-select a profile the browser has used before (id comes from the visitor's
// own localStorage, never a public listing). Verifies the profile still exists.
export async function selectProfile(profileId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("id,name")
    .eq("id", profileId)
    .maybeSingle();
  if (!data) return { ok: false as const, error: "That profile no longer exists." };

  await setProfileCookie(data.id);
  return { ok: true as const, profile: { id: data.id as string, name: data.name as string } };
}

async function setProfileCookie(id: string) {
  const jar = await cookies();
  jar.set(PROFILE_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });
}

export async function switchProfile() {
  const jar = await cookies();
  jar.delete(PROFILE_COOKIE);
  redirect("/join");
}

// ---------- claiming ----------

export async function claimRoute(routeId: number) {
  const profile = await requireProfile();
  const admin = createAdminClient();
  // Atomic: only matches while still 'available'. A concurrent claim gets 0 rows.
  const { data, error } = await admin
    .from("routes")
    .update({
      status: "claimed",
      assigned_to: profile.id,
      assigned_to_name: profile.name,
      assigned_to_email: profile.email,
      assigned_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", routeId)
    .eq("status", "available")
    .select();
  if (error) return { error: error.message };
  if (!data || data.length === 0)
    return { error: "That route was just taken by someone else." };
  revalidatePath("/");
  revalidatePath("/my");
  revalidatePath(`/routes/${routeId}`);
  return { ok: true };
}

export async function releaseRoute(routeId: number) {
  const profile = await requireProfile();
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("routes")
    .update({
      status: "available",
      assigned_to: null,
      assigned_to_name: null,
      assigned_to_email: null,
      assigned_at: null,
      video_path: null,
      uploaded_at: null,
      notes: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", routeId)
    .eq("assigned_to", profile.id)
    .in("status", ["claimed", "uploaded"])
    .select();
  if (error) return { error: error.message };
  if (!data || data.length === 0)
    return { error: "That route is not yours to release." };
  revalidatePath("/");
  revalidatePath("/my");
  revalidatePath(`/routes/${routeId}`);
  return { ok: true };
}

// ---------- uploads ----------

// Presigned PUT URL. The browser uploads the big file directly to R2 with this
// URL (never through the Next.js server).
export async function createUploadUrl(routeId: number, filename: string) {
  const profile = await requireProfile();
  const admin = createAdminClient();
  // Confirm the route is theirs before minting a URL.
  const { data: route } = await admin
    .from("routes")
    .select("assigned_to")
    .eq("id", routeId)
    .maybeSingle();
  if (!route || route.assigned_to !== profile.id)
    return { error: "That route is not assigned to you." };

  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const key = `${routeId}/${Date.now()}-${safe}`;
  const url = await getSignedUrl(
    r2(),
    new PutObjectCommand({ Bucket: R2_BUCKET, Key: key }),
    { expiresIn: 60 * 60 }
  );
  return { key, url };
}

export async function markUploaded(
  routeId: number,
  path: string,
  notes: string
) {
  const profile = await requireProfile();
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("routes")
    .update({
      status: "uploaded",
      video_path: path,
      uploaded_at: new Date().toISOString(),
      notes: notes || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", routeId)
    .eq("assigned_to", profile.id)
    .in("status", ["claimed", "uploaded"])
    .select();
  if (error) return { error: error.message };
  if (!data || data.length === 0)
    return { error: "That route is not yours to upload." };
  revalidatePath("/my");
  revalidatePath("/admin");
  revalidatePath(`/routes/${routeId}`);
  return { ok: true };
}

// ---------- admin ----------

export async function getDownloadUrl(path: string) {
  await requireAdmin();
  // Name the download route-<id>-video.<ext> so it drops straight into the
  // mapsoftheworldroutes public/ folder. The route id is the key's first segment
  // (keys are `<routeId>/<timestamp>-<name>`).
  const routeId = path.split("/")[0];
  const ext = path.includes(".") ? path.split(".").pop()!.toLowerCase() : "mp4";
  const filename = `route-${routeId}-video.${ext}`;
  const url = await getSignedUrl(
    r2(),
    new GetObjectCommand({
      Bucket: R2_BUCKET,
      Key: path,
      ResponseContentDisposition: `attachment; filename="${filename}"`,
    }),
    { expiresIn: 60 * 60 }
  );
  return { url };
}

// Inline (streamable) URL for watching an upload in the browser — no attachment
// disposition, so <video> plays it in place. Available to any signed-in profile
// so employees can preview each other's exports on the showcase, not just admins.
export async function getPreviewUrl(path: string) {
  await requireProfile();
  const url = await getSignedUrl(
    r2(),
    new GetObjectCommand({ Bucket: R2_BUCKET, Key: path }),
    { expiresIn: 60 * 60 }
  );
  return { url };
}

export async function adminMarkDone(routeId: number) {
  await requireAdmin();
  const admin = createAdminClient();
  const { error } = await admin
    .from("routes")
    .update({ status: "done", updated_at: new Date().toISOString() })
    .eq("id", routeId);
  if (error) return { error: error.message };
  revalidatePath("/admin");
  return { ok: true };
}

export async function adminReleaseRoute(routeId: number) {
  await requireAdmin();
  const admin = createAdminClient();
  const { error } = await admin
    .from("routes")
    .update({
      status: "available",
      assigned_to: null,
      assigned_to_name: null,
      assigned_to_email: null,
      assigned_at: null,
      video_path: null,
      uploaded_at: null,
      notes: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", routeId);
  if (error) return { error: error.message };
  revalidatePath("/admin");
  return { ok: true };
}

export async function adminImportRoutes(json: string) {
  await requireAdmin();
  let parsed: SourceRoute[];
  try {
    parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) throw new Error("not an array");
  } catch {
    return { error: "Invalid JSON - expected an array of route objects." };
  }

  const rows = parsed.map((r) => ({
    id: r.id,
    title: r.title,
    subtitle: r.subtitle ?? null,
    origin: r.origin,
    destination: r.destination,
    waypoints: r.waypoints ?? [],
    script: r.script ?? null,
    google_maps_url: r.googleMapsUrl ?? null,
    why_trending: r.whyTrending ?? null,
    script_duration_seconds: r.scriptDurationSeconds ?? null,
    total_distance: r.totalDistance ?? null,
    caption_style: r.captionStyle ?? null,
  }));

  const admin = createAdminClient();
  const { error, count } = await admin
    .from("routes")
    .upsert(rows, { onConflict: "id", count: "exact" });
  if (error) return { error: error.message };
  revalidatePath("/admin");
  revalidatePath("/");
  return { ok: true, count: count ?? rows.length };
}
