import { NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2, R2_BUCKET } from "@/lib/r2";
import { checkUploadKey, findAccount, normalizeHandle } from "@/lib/uploadAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EXPIRES = 60 * 60; // 1h to finish the PUT

// Step 1 of 3. Videos are too big to POST through Vercel, so this only hands
// back a presigned R2 PUT URL; the caller then PUTs the file bytes to it.
//   POST /api/uploads/init  { account, filename }
//   -> { upload_url, video_key, expires_in }
export async function POST(req: Request) {
  const denied = checkUploadKey(req);
  if (denied) return denied;

  const body = await req.json().catch(() => null);
  const handle = normalizeHandle(body?.account);
  const account = handle ? await findAccount(handle) : null;
  if (!account) {
    return NextResponse.json(
      { error: `Unknown account "${body?.account ?? ""}". GET /api/uploads/accounts for valid handles.` },
      { status: 400 },
    );
  }

  const raw = String(body?.filename ?? "video.mp4");
  const ext = (raw.includes(".") ? raw.split(".").pop()! : "mp4").toLowerCase();
  if (!["mp4", "mov", "m4v", "webm"].includes(ext)) {
    return NextResponse.json({ error: `Unsupported file type ".${ext}".` }, { status: 400 });
  }
  const base = raw
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60) || "video";
  const video_key = `accounts/${account.handle}/${Date.now()}-${base}.${ext}`;

  // Only `host` is signed, so the uploader may send any Content-Type.
  const upload_url = await getSignedUrl(
    r2(),
    new PutObjectCommand({ Bucket: R2_BUCKET, Key: video_key }),
    { expiresIn: EXPIRES },
  );

  return NextResponse.json({ upload_url, video_key, expires_in: EXPIRES });
}
