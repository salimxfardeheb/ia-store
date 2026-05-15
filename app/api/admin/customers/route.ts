import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isNextResponse } from "@/lib/rbac";
import type { UnifiedCustomer } from "@/app/variables";

export type { UnifiedCustomer };

// GET /api/admin/customers?q=<search>&page=1&limit=50&channel=<all|online|offline>
// (ADMIN + SELLER)
// Returns a unified, paginated list of:
//   – online: User records (CLIENT role) with their order count
//   – offline: distinct phone contacts from OFFLINE orders, grouped by phone
//
// Pagination is applied on the merged result. X-Total-Count returns the
// merged total before slicing so the client can render a pager.
export async function GET(req: NextRequest) {
  const auth = requireAdmin(req);
  if (isNextResponse(auth)) return auth;

  const url     = new URL(req.url);
  const q       = url.searchParams.get("q")?.trim().toLowerCase() ?? "";
  const channel = (url.searchParams.get("channel") ?? "all") as "all" | "online" | "offline";
  const page    = Math.max(1, parseInt(url.searchParams.get("page")  ?? "1",  10) || 1);
  const limit   = Math.min(200, Math.max(1, parseInt(url.searchParams.get("limit") ?? "50", 10) || 50));
  const skip    = (page - 1) * limit;

  // Hard cap on the *aggregation* side so a malicious actor cannot OOM the
  // process by demanding 1 000 000 contacts. The merged result is still paged.
  const AGG_CAP = 5000;

  // ── 1. Online customers — SQL filter + count ─────────────────────────────
  const onlineWhere = {
    role: "CLIENT" as const,
    ...(q
      ? {
          OR: [
            { name:  { contains: q, mode: "insensitive" as const } },
            { email: { contains: q, mode: "insensitive" as const } },
            { phone: { contains: q } },
          ],
        }
      : {}),
  };

  // ── 2. Offline contacts — aggregate by phone in SQL ──────────────────────
  // groupBy returns one row per distinct phone with order count + latest date.
  const offlineWhere = {
    channel: "OFFLINE" as const,
    userId:  null,
    ...(q
      ? {
          OR: [
            { name:  { contains: q, mode: "insensitive" as const } },
            { phone: { contains: q } },
            { email: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  // Decide which sources to query based on the channel filter
  const wantsOnline  = channel === "all" || channel === "online";
  const wantsOffline = channel === "all" || channel === "offline";

  const [onlineUsers, onlineTotal, offlineGroups, offlineTotalRaw] = await Promise.all([
    wantsOnline
      ? prisma.user.findMany({
          where:   onlineWhere,
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
          take:    AGG_CAP,
        })
      : Promise.resolve([] as never[]),
    wantsOnline ? prisma.user.count({ where: onlineWhere }) : Promise.resolve(0),
    wantsOffline
      ? prisma.order.groupBy({
          by:      ["phone"],
          where:   offlineWhere,
          _count:  { _all: true },
          _max:    { createdAt: true },
          orderBy: { _max: { createdAt: "desc" } },
          take:    AGG_CAP,
        })
      : Promise.resolve([] as never[]),
    // Distinct phone count for total — Prisma exposes `distinct` via raw count
    wantsOffline
      ? prisma.order
          .findMany({
            where:    offlineWhere,
            select:   { phone: true },
            distinct: ["phone"],
          })
          .then((rows) => rows.length)
      : Promise.resolve(0),
  ]);

  // For each offline group we also need name/email/address from the latest order.
  // Fetch them in a single query keyed by (phone, latest createdAt).
  const offlinePhones = offlineGroups.map((g) => g.phone);
  const offlineLatest = offlinePhones.length
    ? await prisma.order.findMany({
        where:    { phone: { in: offlinePhones }, channel: "OFFLINE", userId: null },
        select:   { phone: true, name: true, email: true, address: true, createdAt: true },
        orderBy:  { createdAt: "desc" },
      })
    : [];

  const latestByPhone = new Map<string, { name: string; email: string | null; address: string | null }>();
  for (const o of offlineLatest) {
    if (!latestByPhone.has(o.phone)) {
      latestByPhone.set(o.phone, {
        name:    o.name,
        email:   o.email || null,
        address: o.address || null,
      });
    }
  }

  // ── 3. Map to unified shape ──────────────────────────────────────────────
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

  const offlineCustomers: UnifiedCustomer[] = offlineGroups.map((g) => {
    const latest = latestByPhone.get(g.phone);
    const lastAt = g._max.createdAt?.toISOString() ?? new Date(0).toISOString();
    return {
      id:          `offline:${g.phone}`,
      name:        latest?.name    ?? "",
      email:       latest?.email   ?? null,
      phone:       g.phone,
      address:     latest?.address ?? null,
      channel:     "offline",
      ordersCount: g._count._all,
      lastOrderAt: lastAt,
      createdAt:   lastAt,
    };
  });

  // ── 4. Merge, sort, slice ────────────────────────────────────────────────
  const merged = [...onlineCustomers, ...offlineCustomers].sort((a, b) => {
    const ta = a.lastOrderAt ?? a.createdAt;
    const tb = b.lastOrderAt ?? b.createdAt;
    return tb.localeCompare(ta);
  });

  const total = onlineTotal + offlineTotalRaw;
  const paged = merged.slice(skip, skip + limit);

  return NextResponse.json(paged, {
    headers: {
      "X-Total-Count": String(total),
      "X-Page":        String(page),
      "X-Limit":       String(limit),
    },
  });
}
