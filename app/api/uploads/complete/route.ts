import { NextResponse } from "next/server";
import { HeadObjectCommand } from "@aws-sdk/client-s3";
import { r2, R2_BUCKET } from "@/lib/r2";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkUploadKey, findAccount, normalizeHandle } from "@/lib/uploadAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Step 3 of 3 (after the PUT). Confirms the file really landed in R2, then
// queues it in that account's Logbook tab.
//   POST /api/uploads/complete
//   { account, video_key, caption, title?, uploaded_by?, notes? }
//   -> { id, account, logbook_url }
export async function POST(req: Request) {
  const denied = checkUploadKey(req);
  if (denied) return denied;

  const body = await req.json().catch(() => null);
  const handle = normalizeHandle(body?.account);
  const account = handle ? await findAccount(handle) : null;
  if (!account) {
    return NextResponse.json({ error: `Unknown account "${body?.account ?? ""}".` }, { status: 400 });
  }

  const video_key = String(body?.video_key ?? "");
  if (!video_key.startsWith(`accounts/${account.handle}/`)) {
    return NextResponse.json(
      { error: "video_key does not belong to this account - use the key returned by /init." },
      { status: 400 },
    );
  }

  let video_bytes: number | null = null;
  try {
    const head = await r2().send(new HeadObjectCommand({ Bucket: R2_BUCKET, Key: video_key }));
    video_bytes = head.ContentLength ?? null;
  } catch {
    return NextResponse.json(
      { error: "No file found at video_key - the PUT to upload_url did not finish." },
      { status: 400 },
    );
  }

  const str = (v: unknown, max: number) =>
    v == null ? null : String(v).slice(0, max).trim() || null;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("account_posts")
    .upsert(
      {
        account_id: account.id,
        video_key,
        video_bytes,
        caption: str(body?.caption, 5000) ?? "",
        title: str(body?.title, 200),
        uploaded_by: str(body?.uploaded_by, 100),
        notes: str(body?.notes, 2000),
      },
      { onConflict: "video_key" },
    )
    .select("id")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const origin = new URL(req.url).origin;
  return NextResponse.json({
    id: data.id,
    account: account.handle,
    logbook_url: `${origin}/logbook?account=${encodeURIComponent(account.handle)}`,
  });
}
