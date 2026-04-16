import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isNextResponse } from "@/lib/rbac";
import { apiError } from "@/lib/validation";
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
  const auth = requireAdmin(req);
  if (isNextResponse(auth)) return auth;

  const { id } = await params;
  const body = await req.json().catch(() => null);

  if (!body?.status) {
    return apiError("VALIDATION_ERROR", "Statut requis", 400);
  }

  const { status }: { status: OrderStatus } = body;

  const order = await prisma.order.findUnique({
    where:  { id },
    select: {
      status: true,
      items:  { select: { productId: true, quantity: true, size: true } },
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
            select: { stock: true },
          });
          if (!product) continue;

          if (item.size) {
            // Try ProductSize first (simple products)
            const sizeUpdated = await tx.productSize.updateMany({
              where: { productId: item.productId, size: item.size, quantity: { gte: item.quantity } },
              data:  { quantity: { decrement: item.quantity } },
            });

            if (sizeUpdated.count === 0) {
              // Variant product — find first variant with sufficient stock for this size
              const variantSize = await tx.variantSize.findFirst({
                where: {
                  name:    item.size,
                  stock:   { gte: item.quantity },
                  variant: { productId: item.productId },
                },
              });
              if (!variantSize) {
                throw new Error(
                  `Stock insuffisant pour un article (${item.size}) — disponible : 0`
                );
              }
              await tx.variantSize.update({
                where: { id: variantSize.id },
                data:  { stock: { decrement: item.quantity } },
              });
            }
          }

          const stockUpdated = await tx.product.updateMany({
            where: { id: item.productId, stock: { gte: item.quantity } },
            data:  { stock: { decrement: item.quantity } },
          });
          if (stockUpdated.count === 0) {
            throw new Error(
              `Stock insuffisant — disponible : ${product.stock}, requis : ${item.quantity}`
            );
          }
        }
      }

      if (shouldIncrement) {
        for (const item of order.items) {
          if (!item.productId) continue;

          await tx.product.update({
            where: { id: item.productId },
            data:  { stock: { increment: item.quantity } },
          });

          if (item.size) {
            // Try ProductSize first
            const sizeRestored = await tx.productSize.updateMany({
              where: { productId: item.productId, size: item.size },
              data:  { quantity: { increment: item.quantity } },
            });

            if (sizeRestored.count === 0) {
              // Variant product — restore to first variant that has this size
              const variantSize = await tx.variantSize.findFirst({
                where: { name: item.size, variant: { productId: item.productId } },
              });
              if (variantSize) {
                await tx.variantSize.update({
                  where: { id: variantSize.id },
                  data:  { stock: { increment: item.quantity } },
                });
              }
            }
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
