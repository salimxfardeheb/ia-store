import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";
import { createOrderSchema, safeParse, apiError } from "@/lib/validation";

function getUser(req: NextRequest) {
  const token = getTokenFromRequest(req);
  if (!token) return null;
  return verifyToken(token);
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

  const body = await req.json().catch(() => null);
  const [data, err] = safeParse(createOrderSchema, body);
  if (err) return err;

  const { form, items } = data;

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
        phone:         form.phone,
        email:         form.email,
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
