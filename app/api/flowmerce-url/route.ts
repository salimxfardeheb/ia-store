import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";
import { requireSameOrigin } from "@/lib/csrf";

export async function POST(req: NextRequest) {
  const csrf = requireSameOrigin(req);
  if (csrf) return csrf;

  // 1. Authentification : JWT obligatoire (cookie httpOnly ou Bearer)
  const token = getTokenFromRequest(req);
  const user  = token ? verifyToken(token) : null;
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  // 2. Lecture du body — on n'accepte QUE orderId et productName du client.
  //    Les autres infos (email, téléphone, nom, date) viennent de la DB.
  let body: { orderId?: unknown; productName?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  const { orderId, productName } = body;
  if (typeof orderId !== "string" || !orderId) {
    return NextResponse.json({ error: "orderId requis" }, { status: 400 });
  }
  if (typeof productName !== "string" || !productName) {
    return NextResponse.json({ error: "productName requis" }, { status: 400 });
  }

  // 3. Récupération de la commande + vérification ownership
  const order = await prisma.order.findUnique({
    where:  { id: orderId },
    select: {
      id:        true,
      userId:    true,
      status:    true,
      email:     true,
      name:      true,
      phone:     true,
      createdAt: true,
      items:     { select: { name: true } },
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
  }

  // ADMIN/SELLER peuvent ouvrir une session pour n'importe quelle commande,
  // un CLIENT seulement pour les siennes.
  const isStaff = user.role === "ADMIN" || user.role === "SELLER";
  if (!isStaff && order.userId !== user.id) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  // 4. Le produit signalé doit appartenir à la commande
  if (!order.items.some((it) => it.name === productName)) {
    return NextResponse.json({ error: "Produit absent de la commande" }, { status: 422 });
  }

  // 5. Le signalement n'a de sens que pour une commande livrée
  if (order.status !== "DELIVERED") {
    return NextResponse.json(
      { error: "Signalement impossible pour ce statut" },
      { status: 422 }
    );
  }

  // 6. Appel Flowmerce avec les données authoritatives de la DB
  const apiKey  = process.env.FLOWMERCE_API_KEY;
  const baseUrl = process.env.FLOWMERCE_BASE_URL;

  if (!apiKey)  return NextResponse.json({ error: "Flowmerce non configuré" },          { status: 503 });
  if (!baseUrl) return NextResponse.json({ error: "FLOWMERCE_BASE_URL non configurée" }, { status: 503 });

  let sessionRes: Response;
  try {
    sessionRes = await fetch(`${baseUrl}/api/checkout-session`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        orderId:       order.id,
        customerEmail: order.email,
        productName,
        customerName:  order.name,
        customerPhone: order.phone,
        orderDate:     order.createdAt.toISOString().split("T")[0],
        shopName:      "IA Store",
      }),
    });
  } catch {
    return NextResponse.json({ error: "Impossible de joindre Flowmerce" }, { status: 502 });
  }

  if (!sessionRes.ok) {
    const errBody = await sessionRes.text().catch(() => "");
    return NextResponse.json(
      { error: `Flowmerce: ${sessionRes.status} ${errBody}` },
      { status: 502 }
    );
  }

  const { url } = await sessionRes.json();
  return NextResponse.json({ url });
}
