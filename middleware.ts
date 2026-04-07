import { NextRequest, NextResponse } from "next/server";

// Le middleware est minimal car l'auth est gérée côté client (localStorage + JWT).
// On peut y ajouter une vérification JWT côté serveur plus tard si besoin.
export function middleware(_req: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
