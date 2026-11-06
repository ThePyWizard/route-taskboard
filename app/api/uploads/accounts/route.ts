import { NextResponse } from "next/server";
import { checkUploadKey, activeAccounts } from "@/lib/uploadAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/uploads/accounts  -> { accounts: [{ handle, display_name }] }
export async function GET(req: Request) {
  const denied = checkUploadKey(req);
  if (denied) return denied;
  const accounts = await activeAccounts();
  return NextResponse.json({
    accounts: accounts.map((a) => ({ handle: a.handle, display_name: a.display_name })),
  });
}
