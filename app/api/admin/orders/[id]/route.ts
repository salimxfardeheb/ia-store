import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@/app/variables";

function toPrismaOrderStatus(s: OrderStatus) {
  return s.toUpperCase() as "PENDING" | "CONFIRMED" | "SHIPPED" | "DELIVERED" | "CANCELLED";
}

// PATCH /api/admin/orders/:id  — mettre à jour le statut
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { status }: { status: OrderStatus } = await req.json();

  const updated = await prisma.order.update({
    where: { id },
    data: { status: toPrismaOrderStatus(status) },
  });

  return NextResponse.json({ id: updated.id, status: updated.status.toLowerCase() });
}
