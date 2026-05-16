import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const ABANDONED_AFTER_HOURS = 24;

// POST /api/cron/abandoned-carts
// Intended to be called by a cron scheduler (Vercel Cron, external cron, etc.)
// Protected by a shared secret to prevent public triggering.
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - ABANDONED_AFTER_HOURS * 60 * 60 * 1000);

  // Find users who have at least one cart item untouched since the cutoff,
  // and whose most-recently-updated item is still older than the cutoff
  // (i.e. the entire cart has been idle, not just one stale line).
  const rows = await prisma.cartItem.groupBy({
    by:      ["userId"],
    _max:    { updatedAt: true },
    having:  { updatedAt: { _max: { lt: cutoff } } },
    _count:  { userId: true },
  });

  if (rows.length === 0) {
    return NextResponse.json({ ok: true, abandoned: 0 });
  }

  const userIds = rows.map((r) => r.userId);

  const users = await prisma.user.findMany({
    where:  { id: { in: userIds } },
    select: { id: true, email: true, name: true },
  });

  // Log each abandoned cart — swap this block for your email/notification
  // provider (Resend, Brevo, etc.) when ready.
  for (const user of users) {
    const row = rows.find((r) => r.userId === user.id);
    console.log(
      `[abandoned-cart] userId=${user.id} email=${user.email} ` +
      `items=${row?._count.userId ?? 0} ` +
      `lastActivity=${row?._max.updatedAt?.toISOString()}`
    );
  }

  return NextResponse.json({ ok: true, abandoned: users.length });
}
