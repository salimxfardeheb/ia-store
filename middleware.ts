import { NextRequest, NextResponse } from "next/server";

// Auth is handled inside each API route (requireAdmin / requireOwner).
// This middleware is a pass-through; extend it if you need edge-level logic.
export function middleware(_req: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
