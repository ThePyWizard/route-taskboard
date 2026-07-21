import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { driveFileId } from "@/lib/drive";
import { PROFILE_COOKIE } from "@/lib/session";

export const runtime = "nodejs";

// Google Drive blocks direct downloads of large files behind a "can't scan for
// viruses" HTML interstitial. This route fetches the confirm-bypass endpoint and
// streams the file back with a forced attachment disposition, so downloads happen
// on our site with a clean filename instead of bouncing to Google.
//   GET /api/download?url=<drive share url>&name=entry-001.mp4
export async function GET(req: NextRequest) {
  // Honor-system gate, consistent with the rest of this no-auth app.
  const jar = await cookies();
  if (!jar.get(PROFILE_COOKIE)?.value) {
    return new Response("Not signed in.", { status: 401 });
  }

  const src = req.nextUrl.searchParams.get("url");
  const name = (req.nextUrl.searchParams.get("name") || "video.mp4").replace(
    /[^a-zA-Z0-9._-]/g,
    "_"
  );
  if (!src) return new Response("Missing url", { status: 400 });

  const id = driveFileId(src);
  if (!id) return new Response("Not a Google Drive URL", { status: 400 });

  const upstream = await fetch(
    `https://drive.usercontent.google.com/download?id=${id}&confirm=t`
  );
  const ct = upstream.headers.get("content-type") || "";
  if (!upstream.ok || ct.includes("text/html")) {
    return new Response(
      "Google Drive returned its warning page instead of the file. Check the link is shared publicly.",
      { status: 502 }
    );
  }

  const headers = new Headers();
  headers.set("Content-Type", "application/octet-stream");
  headers.set("Content-Disposition", `attachment; filename="${name}"`);
  const len = upstream.headers.get("content-length");
  if (len) headers.set("Content-Length", len);
  return new Response(upstream.body, { headers });
}
