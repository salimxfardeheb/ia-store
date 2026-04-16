import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromHeader, verifyToken } from "@/lib/auth";
import { createOrderSchema, safeParse, apiError } from "@/lib/validation";

function getUser(req: NextRequest) {
  const token = getTokenFromHeader(req.headers.get("Authorization"));
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
    select: { id: true, name: true, price: true, mainImage: true, category: true, stock: true, sizes: true },
  });

  if (dbProducts.length !== productIds.length) {
    return apiError(
      "PRODUCT_UNAVAILABLE",
      "Un ou plusieurs produits sont indisponibles",
      422
    );
  }

  const productMap = new Map(dbProducts.map((p) => [p.id, p]));

  // Vérifier le stock disponible pour chaque article + taille
  for (const item of items) {
    const product = productMap.get(item.id)!;
    if (item.selectedSize) {
      const sizeEntry = product.sizes.find((s) => s.size === item.selectedSize);
      if (!sizeEntry || item.quantity > sizeEntry.quantity) {
        return apiError(
          "STOCK_INSUFFICIENT",
          `Stock insuffisant pour ${product.name} · Taille ${item.selectedSize} (disponible : ${sizeEntry?.quantity ?? 0})`,
          422
        );
      }
    } else if (item.quantity > product.stock) {
      return apiError(
        "STOCK_INSUFFICIENT",
        `Stock insuffisant pour ${product.name} (disponible : ${product.stock})`,
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
              size:      item.selectedSize ?? null,
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
