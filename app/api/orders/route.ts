import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";
import { createOrderSchema, safeParse, apiError } from "@/lib/validation";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { normalizePhoneDZ } from "@/lib/phone";

function getUser(req: NextRequest) {
  const token = getTokenFromRequest(req);
  if (!token) return null;
  return verifyToken(token);
}

function tooManyRequests(retryAfter?: number) {
  return NextResponse.json(
    { code: "RATE_LIMITED", message: "Trop de commandes envoyées. Réessayez dans quelques minutes." },
    { status: 429, headers: { "Retry-After": String(retryAfter ?? 60) } }
  );
}

// GET /api/orders — orders of the authenticated user
export async function GET(req: NextRequest) {
  const user = getUser(req);
  if (!user) return apiError("UNAUTHORIZED", "Non autorisé", 401);

  const orders = await prisma.order.findMany({
    where:   { userId: user.id },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(orders);
}

// POST /api/orders — create an online order (guest or authenticated)
export async function POST(req: NextRequest) {
  const user = getUser(req);

  // ─── Rate-limit IP : bloque tôt le flood (avant parsing/DB) ─────────────
  // 5 commandes / 10 min / IP — limite franche contre les bots invités.
  const ipKey = `order:ip:${getClientIp(req)}`;
  const ipRl = checkRateLimit(ipKey, { max: 5, windowMs: 10 * 60_000 });
  if (!ipRl.allowed) return tooManyRequests(ipRl.retryAfter);

  const body = await req.json().catch(() => null);
  const [data, err] = safeParse(createOrderSchema, body);
  if (err) return err;

  const { form, items } = data;

  // ─── Normalisation téléphone DZ → E.164 ────────────────────────────────
  // Stocker un format unique évite les doublons (0612… vs +21361…) et
  // permet un rate-limit fiable par numéro.
  const normalizedPhone = normalizePhoneDZ(form.phone);
  if (!normalizedPhone) {
    return apiError("VALIDATION_ERROR", "Numéro de téléphone invalide", 400);
  }

  // ─── Rate-limit téléphone : 3 commandes / 10 min ──────────────────────
  // Empêche un même numéro de spammer la table, même via IP différentes.
  const phoneRl = checkRateLimit(
    `order:phone:${normalizedPhone}`,
    { max: 3, windowMs: 10 * 60_000 }
  );
  if (!phoneRl.allowed) return tooManyRequests(phoneRl.retryAfter);

  // ─── Rate-limit user (si authentifié) : 10 / 10 min ───────────────────
  // Plus souple pour les comptes connectés (cas légitimes : reprise après
  // erreur paiement, etc.).
  if (user) {
    const userRl = checkRateLimit(
      `order:user:${user.id}`,
      { max: 10, windowMs: 10 * 60_000 }
    );
    if (!userRl.allowed) return tooManyRequests(userRl.retryAfter);
  }

  // TODO captcha : ajouter Cloudflare Turnstile sur les guests
  // (clé `TURNSTILE_SECRET_KEY` + vérif serveur de `cf-turnstile-response`).

  // Email vide en DB pollue les analytics : normaliser, mais garder "" si
  // pas fourni (colonne NOT NULL — migration séparée pour passer nullable).
  const normalizedEmail = form.email.trim().toLowerCase();

  // Fetch all referenced products from DB to get authoritative prices
  const productIds  = [...new Set(items.map((i) => i.id))];
  const dbProducts  = await prisma.product.findMany({
    where:  { id: { in: productIds }, status: "ACTIVE", deletedAt: null },
    select: {
      id: true, name: true, price: true, mainImage: true, category: true, stock: true,
      sizes:    true,
      variants: { select: { color: true, sizes: { select: { name: true, stock: true } } } },
    },
  });

  if (dbProducts.length !== productIds.length) {
    return apiError(
      "PRODUCT_UNAVAILABLE",
      "Un ou plusieurs produits sont indisponibles",
      422
    );
  }

  const productMap = new Map(dbProducts.map((p) => [p.id, p]));

  // Vérifier le stock disponible pour chaque article — scope par couleur si fournie
  for (const item of items) {
    const product = productMap.get(item.id)!;
    const hasVariants = product.variants.length > 0;

    // Produit à variantes : la couleur est obligatoire pour scoper le stock
    if (hasVariants && !item.selectedColor) {
      return apiError(
        "VALIDATION_ERROR",
        `Couleur requise pour ${product.name}`,
        422
      );
    }

    let available: number;
    let label: string;

    if (item.selectedColor) {
      const variant = product.variants.find((v) => v.color === item.selectedColor);
      if (!variant) {
        return apiError(
          "VALIDATION_ERROR",
          `Couleur inconnue pour ${product.name} : ${item.selectedColor}`,
          422
        );
      }
      if (item.selectedSize) {
        available = variant.sizes.find((s) => s.name === item.selectedSize)?.stock ?? 0;
        label = `${product.name} · ${item.selectedColor} · Taille ${item.selectedSize}`;
      } else {
        available = variant.sizes.reduce((sum, s) => sum + s.stock, 0);
        label = `${product.name} · ${item.selectedColor}`;
      }
    } else if (item.selectedSize) {
      const sizeEntry = product.sizes.find((s) => s.size === item.selectedSize);
      available = sizeEntry?.quantity ?? 0;
      label = `${product.name} · Taille ${item.selectedSize}`;
    } else {
      available = product.stock;
      label = product.name;
    }

    if (item.quantity > available) {
      return apiError(
        "STOCK_INSUFFICIENT",
        `Stock insuffisant pour ${label} (disponible : ${available})`,
        422
      );
    }
  }

  // Recalculate total server-side — never trust client-provided prices
  const serverTotal = items.reduce((sum, item) => {
    return sum + productMap.get(item.id)!.price * item.quantity;
  }, 0);

  try {
    const order = await prisma.order.create({
      data: {
        userId:        user?.id ?? null,
        total:         serverTotal,
        status:        "PENDING",
        paymentMethod: form.paymentMethod,
        deliveryType:  form.deliveryType,
        name:          form.name,
        phone:         normalizedPhone,
        email:         normalizedEmail,
        city:          form.city,
        address:       form.address,
        postalCode:    form.postalCode,
        items: {
          create: items.map((item) => {
            const p = productMap.get(item.id)!;
            return {
              ...(item.id ? { product: { connect: { id: item.id } } } : {}),
              name:      p.name,
              price:     p.price,  // DB price
              quantity:  item.quantity,
              size:      item.selectedSize  ?? null,
              color:     item.selectedColor ?? null,
              mainImage: p.mainImage,
              category:  p.category,
            };
          }),
        },
      },
    });

    return NextResponse.json({ id: order.id }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/orders]", err);
    return apiError("INTERNAL_ERROR", "Erreur lors de la création de la commande", 500);
  }
}
