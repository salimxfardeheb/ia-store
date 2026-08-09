import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";
import { requireSameOrigin } from "@/lib/csrf";
import { apiError, handleDbError } from "@/lib/validation";
import {
  buildReturnSessionPayload,
  parseReturnSessionFailure,
  parseReturnSessionResponse,
} from "@/lib/flowmerce";
import { shippingForOrder } from "@/lib/shipping";
import { ageFromBirthDate } from "@/lib/age";

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
  let order;
  try {
    order = await prisma.order.findUnique({
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
        deliveryType:  true,
        createdAt:     true,
        items:         { select: { name: true, price: true, quantity: true } },
        // Date de naissance et genre vivent sur le compte, pas sur la commande.
        // Absents pour une vente au comptoir (aucun compte) ou un profil non
        // renseigné.
        user:          { select: { birthDate: true, gender: true } },
      },
    });
  } catch (err) {
    return handleDbError(err);
  }

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

  // 6. Construction du payload à partir des données authoritatives de la DB.
  //    Tout champ transmis est pré-rempli sur la page de retour ; tout champ
  //    omis devient une saisie supplémentaire pour le client.
  // Yalidine n'est pas intégré à la boutique : le mode de livraison et le
  // forfait viennent des constantes. Le retrait en magasin (POS) a bien un
  // mode, facturé 0 DA.
  const shipping = shippingForOrder(order.deliveryType);
  if (!shipping) {
    // Sans mode de livraison, Flowmerce applique son repli « Standard » / 0.
    // C'est une dégradation du score anti-fraude, pas un cas nominal.
    console.warn("[flowmerce] mode de livraison indéterminé", {
      orderId:      order.id,
      deliveryType: order.deliveryType,
    });
  }

  const built = buildReturnSessionPayload({
    orderId:       order.id,
    customerId:    order.userId,
    email:         order.email,
    name:          order.name,
    phone:         order.phone,
    city:          order.city,
    paymentMethod: order.paymentMethod,
    createdAt:     order.createdAt,
    total:         order.total,
    productName,
    productPrice:  matchedItem.price,
    quantity:      matchedItem.quantity,
    shippingMethod: shipping?.method ?? null,
    shippingCost:   shipping?.price  ?? null,
    // Flowmerce attend un âge, pas une date : on le calcule à l'envoi pour
    // qu'il ne se périme jamais.
    customerAge:    ageFromBirthDate(order.user?.birthDate),
    customerGender: order.user?.gender ?? null,
  });

  for (const field of built.omitted) {
    console.warn("[flowmerce] champ omis du payload", {
      orderId: order.id,
      field:   field.field,
      reason:  field.reason,
      detail:  field.detail,
    });
  }

  if (!built.ok) {
    console.error("[flowmerce] champ obligatoire inutilisable", {
      orderId: order.id,
      ...built.invalid,
    });
    return apiError(
      "RETURN_SESSION_INCOMPLETE",
      "Les informations de cette commande ne permettent pas d'ouvrir une demande de retour. Contactez le service client.",
      422
    );
  }

  // 7. Appel Flowmerce — depuis le backend uniquement, la clé API ne doit
  //    jamais transiter côté navigateur.
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
      body: JSON.stringify(built.payload),
    });
  } catch {
    return NextResponse.json({ error: "Impossible de joindre Flowmerce" }, { status: 502 });
  }

  if (!sessionRes.ok) {
    const raw     = await sessionRes.text().catch(() => "");
    const failure = parseReturnSessionFailure(sessionRes.status, raw);

    switch (failure.kind) {
      // Cas métier : le délai de retour du vendeur est dépassé. Ce n'est pas
      // une panne — on ne propose simplement pas le retour au client.
      case "return_window_expired":
        return apiError(
          "RETURN_WINDOW_EXPIRED",
          "Le délai de retour de cette commande est dépassé.",
          422
        );

      case "bad_request":
        console.error("[flowmerce] payload refusé (400)", {
          orderId: order.id,
          message: failure.message,
          payload: built.payload,
        });
        return NextResponse.json(
          { error: "Demande de retour impossible pour le moment." },
          { status: 502 }
        );

      // Clé API invalide/révoquée ou compte vendeur non approuvé : à traiter
      // côté exploitation, inutile de retenter.
      case "account":
        console.error("[flowmerce] ALERTE compte/clé API", {
          status:  failure.status,
          message: failure.message,
        });
        return NextResponse.json(
          { error: "Service de retour indisponible." },
          { status: 503 }
        );

      case "rate_limited":
        return NextResponse.json(
          { error: "Trop de demandes. Veuillez réessayer dans quelques instants." },
          { status: 429 }
        );

      default:
        console.error("[flowmerce] échec création de session", {
          orderId: order.id,
          status:  failure.status,
          message: failure.message,
        });
        return NextResponse.json(
          { error: "Service de retour indisponible." },
          { status: 502 }
        );
    }
  }

  const session = parseReturnSessionResponse(await sessionRes.json().catch(() => null));
  if (!session) {
    console.error("[flowmerce] réponse 201 inexploitable", { orderId: order.id });
    return NextResponse.json({ error: "Service de retour indisponible." }, { status: 502 });
  }

  // 8. Rien n'est stocké côté boutique : Flowmerce est seul dépositaire de la
  //    réclamation et son API permet de la relire. On renvoie l'URL telle
  //    qu'il l'a fournie — jamais une URL reconstruite.
  return NextResponse.json({ url: session.url, expiresAt: new Date(session.expires_at) });
}
