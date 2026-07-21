import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2, R2_BUCKET } from "@/lib/r2";
import { PROFILE_COOKIE } from "@/lib/session";

export const runtime = "nodejs";

// Presign an R2 object and 302-redirect to it. Fronting the presign with a
// same-origin URL lets the logbook download be a plain <a href> — a synchronous
// navigation inside the tap — which iOS Safari requires (it blocks window.open()
// called after an await). ?inline=1 omits the attachment disposition (for "Open").
//   GET /api/content-download?key=<r2 object key>[&inline=1]
export async function GET(req: NextRequest) {
  const jar = await cookies();
  if (!jar.get(PROFILE_COOKIE)?.value) {
    return new Response("Not signed in.", { status: 401 });
  }

  const key = req.nextUrl.searchParams.get("key");
  if (!key) return new Response("Missing key", { status: 400 });
  const inline = req.nextUrl.searchParams.get("inline") === "1";

  const routeId = key.split("/")[0];
  const ext = key.includes(".") ? key.split(".").pop()!.toLowerCase() : "mp4";
  const filename = `route-${routeId}-video.${ext}`;

  const url = await getSignedUrl(
    r2(),
    new GetObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      ...(inline
        ? {}
        : { ResponseContentDisposition: `attachment; filename="${filename}"` }),
    }),
    { expiresIn: 60 * 60 }
  );

  return NextResponse.redirect(url, 302);
}
