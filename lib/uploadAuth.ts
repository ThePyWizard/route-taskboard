import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SocialAccount } from "@/lib/types";

// Shared-secret auth for the machine upload API (/api/uploads/*), used by the
// employee "taskboard upload" Claude skill. The secret lives in the
// UPLOAD_API_KEY env var and is sent as `Authorization: Bearer <key>`.
// Returns a 401/500 response to send back, or null when the caller is allowed.
export function checkUploadKey(req: Request): NextResponse | null {
  const expected = process.env.UPLOAD_API_KEY;
  if (!expected) {
    return NextResponse.json(
      { error: "UPLOAD_API_KEY is not configured on the server." },
      { status: 500 },
    );
  }
  const got = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  const a = Buffer.from(got);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return NextResponse.json({ error: "Invalid or missing API key." }, { status: 401 });
  }
  return null;
}

export function normalizeHandle(h: unknown): string {
  return String(h ?? "").trim().replace(/^@/, "").toLowerCase();
}

export async function findAccount(handle: string): Promise<SocialAccount | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("social_accounts")
    .select("*")
    .eq("handle", handle)
    .eq("active", true)
    .maybeSingle();
  return (data as SocialAccount) ?? null;
}

export async function activeAccounts(): Promise<SocialAccount[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("social_accounts")
    .select("*")
    .eq("active", true)
    .order("sort_order", { ascending: true });
  return (data ?? []) as SocialAccount[];
}
