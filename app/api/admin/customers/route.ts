import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isNextResponse } from "@/lib/rbac";
import type { UnifiedCustomer } from "@/app/variables";

export type { UnifiedCustomer };

// GET /api/admin/customers?q=<search>  (ADMIN + SELLER)
// Returns a unified list of:
//   – online: User records (CLIENT role) with their order count
//   – offline: distinct phone contacts from OFFLINE orders, grouped by phone
export async function GET(req: NextRequest) {
  const auth = requireAdmin(req);
  if (isNextResponse(auth)) return auth;

  const q = new URL(req.url).searchParams.get("q")?.trim().toLowerCase() ?? "";

  // ── 1. Online customers (User with CLIENT role) ───────────────────────────
  const onlineUsers = await prisma.user.findMany({
    where: {
      role: "CLIENT",
      ...(q
        ? {
            OR: [
              { name:  { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
              { phone: { contains: q } },
            ],
          }
        : {}),
    },
    select: {
      id:        true,
      name:      true,
      email:     true,
      phone:     true,
      address:   true,
      createdAt: true,
      orders:    { select: { createdAt: true }, orderBy: { createdAt: "desc" }, take: 1 },
      _count:    { select: { orders: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // ── 2. Offline contacts grouped by phone ─────────────────────────────────
  // Fetch all OFFLINE orders (no userId) then group in JS for full portability
  const offlineOrders = await prisma.order.findMany({
    where:  { channel: "OFFLINE", userId: null },
    select: { phone: true, name: true, email: true, address: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  // Group by phone — keep latest name/email, count orders
  const offlineMap = new Map<string, {
    name: string; email: string | null; address: string | null;
    ordersCount: number; lastOrderAt: Date;
  }>();
  for (const o of offlineOrders) {
    const phone = o.phone.trim();
    if (!offlineMap.has(phone)) {
      offlineMap.set(phone, {
        name:        o.name,
        email:       o.email || null,
        address:     o.address || null,
        ordersCount: 1,
        lastOrderAt: o.createdAt,
      });
    } else {
      offlineMap.get(phone)!.ordersCount++;
    }
  }

  // Build unified offline array (apply search filter)
  const offlineCustomers: UnifiedCustomer[] = [];
  for (const [phone, info] of offlineMap) {
    if (
      q &&
      !info.name.toLowerCase().includes(q) &&
      !phone.includes(q) &&
      !(info.email ?? "").toLowerCase().includes(q)
    ) {
      continue;
    }
    offlineCustomers.push({
      id:          `offline:${phone}`,
      name:        info.name,
      email:       info.email,
      phone,
      address:     info.address,
      channel:     "offline",
      ordersCount: info.ordersCount,
      lastOrderAt: info.lastOrderAt.toISOString(),
      createdAt:   info.lastOrderAt.toISOString(),
    });
  }

  // ── 3. Map online users to unified shape ─────────────────────────────────
  const onlineCustomers: UnifiedCustomer[] = onlineUsers.map((u) => ({
    id:          u.id,
    name:        u.name,
    email:       u.email,
    phone:       u.phone,
    address:     u.address,
    channel:     "online",
    ordersCount: u._count.orders,
    lastOrderAt: u.orders[0]?.createdAt.toISOString() ?? null,
    createdAt:   u.createdAt.toISOString(),
  }));

  // ── 4. Merge and sort by last activity desc ───────────────────────────────
  const merged = [...onlineCustomers, ...offlineCustomers].sort((a, b) => {
    const ta = a.lastOrderAt ?? a.createdAt;
    const tb = b.lastOrderAt ?? b.createdAt;
    return tb.localeCompare(ta);
  });

  return NextResponse.json(merged);
}
