import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, isNextResponse } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { handleDbError } from "@/lib/validation";

const REPORTABLE_STATUSES = new Set(["DELIVERED", "RETURNED"]);

const VALID_REASONS = new Set([
  "Client absent",
  "Client a changé d'avis",
  "Client a refusé sans motif",
  "Autre",
]);

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAdmin(req);
  if (isNextResponse(auth)) return auth;

  const { id } = await params;

  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "Identifiant manquant" }, { status: 400 });
  }

  let reason: string;
  try {
    ({ reason } = await req.json());
  } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  if (!reason || !VALID_REASONS.has(reason)) {
    return NextResponse.json({ error: "Raison invalide" }, { status: 400 });
  }

  let order: { id: string; status: string; email: string; phone: string } | null;
  try {
    order = await prisma.order.findUnique({
      where: { id },
      select: { id: true, status: true, email: true, phone: true },
    });
  } catch (err) {
    return handleDbError(err);
  }

  if (!order) {
    return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
  }

  if (!REPORTABLE_STATUSES.has(order.status)) {
    return NextResponse.json(
      { error: "Signalement impossible pour ce statut" },
      { status: 422 }
    );
  }

  const apiKey  = process.env.FLOWMERCE_API_KEY;
  const baseUrl = process.env.FLOWMERCE_BASE_URL;

  if (!apiKey || !baseUrl) {
    return NextResponse.json({ error: "Flowmerce non configuré" }, { status: 503 });
  }

  let flowRes: Response;
  try {
    flowRes = await fetch(`${baseUrl}/api/fraud/report-refusal`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        customer_email: order.email,
        customer_phone: order.phone,
        order_id:       order.id,
        refusal_reason: reason,
      }),
    });
  } catch {
    return NextResponse.json({ error: "Impossible de joindre Flowmerce" }, { status: 502 });
  }

  if (!flowRes.ok) {
    const body = await flowRes.text().catch(() => "");
    return NextResponse.json(
      { error: `Flowmerce: ${flowRes.status} ${body}` },
      { status: 502 }
    );
  }

  const data = await flowRes.json().catch(() => ({}));
  return NextResponse.json({ ok: true, fraudScore: data.newFraudScore ?? null });
}
