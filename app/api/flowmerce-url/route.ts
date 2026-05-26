import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";
import { requireSameOrigin } from "@/lib/csrf";

export async function POST(req: NextRequest) {
  const csrf = requireSameOrigin(req);
  if (csrf) return csrf;

  // 1. Authentification : JWT obligatoire (cookie httpOnly ou Bearer)
  const token = getTokenFromRequest(req);
  const user  = token ? await verifyToken(token) : null;
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
      id:            true,
      userId:        true,
      status:        true,
      email:         true,
      name:          true,
      phone:         true,
      city:          true,
      total:         true,
      paymentMethod: true,
      createdAt:     true,
      items:         { select: { name: true, price: true, quantity: true } },
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
  const matchedItem = order.items.find((it) => it.name === productName);
  if (!matchedItem) {
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
    sessionRes = await fetch(`${baseUrl}/api/return-sessions`, {
      method: "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        order_id:       order.id,
        customer_email: order.email ?? "",
        customer_name:  order.name,
        product_name:   productName,

        // Champs optionnels disponibles en DB
        customer_phone:   order.phone,
        customer_wilaya:  order.city ?? undefined,
        payment_method:   order.paymentMethod,
        order_date:       order.createdAt.toISOString().split("T")[0],
        order_total:      order.total,
        product_price:    matchedItem.price,
        product_quantity: matchedItem.quantity,
      }),
    });
  } catch {
    return NextResponse.json({ error: "Impossible de joindre Flowmerce" }, { status: 502 });
  }

  if (sessionRes.status === 429) {
    return NextResponse.json(
      { error: "Trop de demandes. Veuillez réessayer dans quelques instants." },
      { status: 429 }
    );
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