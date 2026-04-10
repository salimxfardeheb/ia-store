import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@/app/variables";
import { isValidTransition } from "@/lib/orderStatus";

function toPrismaOrderStatus(s: OrderStatus) {
  return s.toUpperCase() as "PENDING" | "CONFIRMED" | "SHIPPED" | "DELIVERED" | "CANCELLED" | "RETURNED";
}

// Statuts depuis lesquels le stock a déjà été prélevé
const STOCK_TAKEN: OrderStatus[] = ["confirmed", "shipped", "delivered"];

// PATCH /api/admin/orders/:id  — mettre à jour le statut + synchroniser le stock
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { status }: { status: OrderStatus } = await req.json();

  // Récupère la commande avec ses articles en une seule requête
  const order = await prisma.order.findUnique({
    where: { id },
    select: {
      status: true,
      items: { select: { productId: true, quantity: true, size: true } },
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
  }

  const currentStatus = order.status.toLowerCase() as OrderStatus;

  if (!isValidTransition(currentStatus, status)) {
    return NextResponse.json(
      { error: `Transition invalide : "${currentStatus}" → "${status}"` },
      { status: 422 }
    );
  }

  // Détermine si le stock doit être modifié
  const shouldDecrement = status === "confirmed";
  const shouldIncrement =
    status === "returned" ||
    (status === "cancelled" && STOCK_TAKEN.includes(currentStatus));

  // Transaction atomique : mise à jour statut + stock en une seule opération
  const updated = await prisma.$transaction(async (tx) => {
    if (shouldDecrement || shouldIncrement) {
      for (const item of order.items) {
        if (!item.productId) continue;

        const delta = shouldDecrement ? -item.quantity : item.quantity;

        // 1. Mettre à jour le stock total du produit
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: delta } },
        });

        // 2. Mettre à jour la quantité de la taille spécifique (si connue)
        if (item.size) {
          await tx.productSize.updateMany({
            where: { productId: item.productId, size: item.size },
            data: { quantity: { increment: delta } },
          });
        }
      }
    }

    // Mise à jour du statut de la commande
    return tx.order.update({
      where: { id },
      data: { status: toPrismaOrderStatus(status) },
    });
  });

  return NextResponse.json({ id: updated.id, status: updated.status.toLowerCase() });
}
