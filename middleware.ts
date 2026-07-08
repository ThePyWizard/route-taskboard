import { NextResponse, type NextRequest } from "next/server";
import { PROFILE_COOKIE } from "@/lib/constants";

// No auth. Just make sure a profile has been created before using the board.
export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  // /jobs/* is the machine-readable job JSON consumed by the motwr CLI, which
  // has no profile cookie — keep it public.
  const isPublic = path.startsWith("/join") || path.startsWith("/jobs");
  const hasProfile = request.cookies.has(PROFILE_COOKIE);

  if (!hasProfile && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/join";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
