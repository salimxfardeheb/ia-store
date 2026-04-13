import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isNextResponse } from "@/lib/rbac";
import { posBodySchema, safeParse, apiError } from "@/lib/validation";

// POST /api/admin/pos — create an offline sale (ADMIN + SELLER)
export async function POST(req: NextRequest) {
  const auth = requireAdmin(req);
  if (isNextResponse(auth)) return auth;

  const body = await req.json().catch(() => null);
  const [data, err] = safeParse(posBodySchema, body);
  if (err) return err;

  const { customer, items, paymentMethod } = data;

  try {
    const order = await prisma.$transaction(async (tx) => {
      // 1. Fetch DB prices and build product map — never trust client-supplied values
      const productIds = items.map((i) => i.productId);
      const dbProducts = await tx.product.findMany({
        where:   { id: { in: productIds } },
        include: { sizes: true },
      });

      const productMap = new Map(dbProducts.map((p) => [p.id, p]));

      for (const item of items) {
        const product = productMap.get(item.productId);

        if (!product || product.deletedAt) {
          throw new Error(`Produit introuvable : ID ${item.productId}`);
        }
        if (product.status !== "ACTIVE") {
          throw new Error(`Produit indisponible : ${product.name}`);
        }

        // 2. Atomic conditional stock decrement — eliminates TOCTOU race condition
        if (item.size) {
          const sizeUpdated = await tx.productSize.updateMany({
            where: { productId: item.productId, size: item.size, quantity: { gte: item.quantity } },
            data:  { quantity: { decrement: item.quantity } },
          });
          if (sizeUpdated.count === 0) {
            const sizeRow = product.sizes.find((s) => s.size === item.size);
            throw new Error(
              `Stock insuffisant pour ${product.name} (${item.size}) — disponible : ${sizeRow?.quantity ?? 0}`
            );
          }
        }

        const stockUpdated = await tx.product.updateMany({
          where: { id: item.productId, stock: { gte: item.quantity } },
          data:  { stock: { decrement: item.quantity } },
        });
        if (stockUpdated.count === 0) {
          throw new Error(
            `Stock insuffisant pour ${product.name} — disponible : ${product.stock}`
          );
        }
      }

      // 3. Recalculate total server-side — never trust client total
      const serverTotal = items.reduce((sum, item) => {
        const p = productMap.get(item.productId)!;
        return sum + p.price * item.quantity;
      }, 0);

      // 4. Create order: CONFIRMED + OFFLINE — snapshot fields only, no FK to customer
      return tx.order.create({
        data: {
          channel:       "OFFLINE",
          status:        "CONFIRMED",
          total:         serverTotal,
          paymentMethod,
          deliveryType:  "store",
          name:          customer.name.trim(),
          phone:         customer.phone.trim(),
          email:         customer.email?.trim()   ?? "",
          city:          "",
          address:       customer.address?.trim() ?? "",
          postalCode:    "",
          items: {
            create: items.map((item) => {
              const p = productMap.get(item.productId)!;
              return {
                product:   { connect: { id: item.productId } },
                name:      p.name,
                price:     p.price,
                quantity:  item.quantity,
                size:      item.size ?? null,
                mainImage: p.mainImage,
                category:  p.category,
              };
            }),
          },
        },
      });
    });

    return NextResponse.json({ id: order.id }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    return apiError("SALE_FAILED", message, 422);
  }
}
