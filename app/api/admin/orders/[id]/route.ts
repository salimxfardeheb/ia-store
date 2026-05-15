import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isNextResponse } from "@/lib/rbac";
import { apiError, orderStatusUpdateSchema, safeParse } from "@/lib/validation";
import { OrderStatus } from "@/app/variables";
import { isValidTransition } from "@/lib/orderStatus";

function toPrismaOrderStatus(s: OrderStatus) {
  return s.toUpperCase() as
    | "PENDING" | "CONFIRMED" | "SHIPPED" | "DELIVERED" | "CANCELLED" | "RETURNED";
}

// Statuses where stock has already been decremented
const STOCK_TAKEN: OrderStatus[] = ["confirmed", "shipped", "delivered"];

// PATCH /api/admin/orders/:id — update status + synchronise stock (ADMIN + SELLER)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(req);
  if (isNextResponse(auth)) return auth;

  const { id } = await params;
  const body = await req.json().catch(() => null);

  const [data, parseErr] = safeParse(orderStatusUpdateSchema, body);
  if (parseErr) return parseErr;
  const status = data.status as OrderStatus;

  const order = await prisma.order.findUnique({
    where:  { id },
    select: {
      status: true,
      items:  { select: { productId: true, quantity: true, size: true, color: true, name: true } },
    },
  });

  if (!order) {
    return apiError("NOT_FOUND", "Commande introuvable", 404);
  }

  const currentStatus = order.status.toLowerCase() as OrderStatus;

  if (!isValidTransition(currentStatus, status)) {
    return apiError(
      "INVALID_TRANSITION",
      `Transition invalide : "${currentStatus}" → "${status}"`,
      422
    );
  }

  const shouldDecrement = status === "confirmed";
  const shouldIncrement =
    status === "returned" ||
    (status === "cancelled" && STOCK_TAKEN.includes(currentStatus));

  try {
    const updated = await prisma.$transaction(async (tx) => {
      if (shouldDecrement) {
        for (const item of order.items) {
          if (!item.productId) continue;

          const product = await tx.product.findUnique({
            where: { id: item.productId },
            select: { stock: true, _count: { select: { variants: true } } },
          });
          if (!product) continue;

          const hasVariants = product._count.variants > 0;

          if (item.color) {
            // Variant product — scope decrement to the exact (color, size) variant snapshot
            if (!item.size) {
              throw new Error(
                `Taille manquante pour ${item.name} (${item.color}) — impossible de décrémenter le stock`
              );
            }
            const variantSizeUpdated = await tx.variantSize.updateMany({
              where: {
                name:    item.size,
                stock:   { gte: item.quantity },
                variant: { productId: item.productId, color: item.color },
              },
              data: { stock: { decrement: item.quantity } },
            });
            if (variantSizeUpdated.count === 0) {
              throw new Error(
                `Stock insuffisant pour ${item.name} (${item.color} · ${item.size})`
              );
            }
          } else if (item.size) {
            // Simple product with size — decrement the flat ProductSize row
            const sizeUpdated = await tx.productSize.updateMany({
              where: { productId: item.productId, size: item.size, quantity: { gte: item.quantity } },
              data:  { quantity: { decrement: item.quantity } },
            });
            if (sizeUpdated.count === 0) {
              throw new Error(
                `Stock insuffisant pour ${item.name} (${item.size})`
              );
            }
          }

          // Product.stock n'est maintenu que pour les produits simples ;
          // pour les produits à variantes, VariantSize.stock fait foi.
          if (!hasVariants) {
            const stockUpdated = await tx.product.updateMany({
              where: { id: item.productId, stock: { gte: item.quantity } },
              data:  { stock: { decrement: item.quantity } },
            });
            if (stockUpdated.count === 0) {
              throw new Error(
                `Stock insuffisant pour ${item.name} — disponible : ${product.stock}, requis : ${item.quantity}`
              );
            }
          }
        }
      }

      if (shouldIncrement) {
        for (const item of order.items) {
          if (!item.productId) continue;

          const product = await tx.product.findUnique({
            where: { id: item.productId },
            select: { _count: { select: { variants: true } } },
          });
          if (!product) continue;

          const hasVariants = product._count.variants > 0;

          // Symétrique du décrément : ne pas toucher Product.stock pour les variantes.
          if (!hasVariants) {
            await tx.product.update({
              where: { id: item.productId },
              data:  { stock: { increment: item.quantity } },
            });
          }

          if (item.color && item.size) {
            // Restore the exact (color, size) variant snapshot
            await tx.variantSize.updateMany({
              where: {
                name:    item.size,
                variant: { productId: item.productId, color: item.color },
              },
              data: { stock: { increment: item.quantity } },
            });
          } else if (item.size) {
            await tx.productSize.updateMany({
              where: { productId: item.productId, size: item.size },
              data:  { quantity: { increment: item.quantity } },
            });
          }
        }
      }

      return tx.order.update({
        where: { id },
        data:  { status: toPrismaOrderStatus(status) },
      });
    });

    return NextResponse.json({ id: updated.id, status: updated.status.toLowerCase() });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    return apiError("STOCK_INSUFFICIENT", message, 422);
  }
}
