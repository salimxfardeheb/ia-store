import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromHeader, verifyToken } from "@/lib/auth";

function getUser(req: NextRequest) {
  const token = getTokenFromHeader(req.headers.get("Authorization"));
  if (!token) return null;
  return verifyToken(token);
}

// GET /api/profile
export async function GET(req: NextRequest) {
  const user = getUser(req);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      city: true,
      address: true,
      postalCode: true,
    },
  });

  return NextResponse.json(profile);
}

// PATCH /api/profile
export async function PATCH(req: NextRequest) {
  const user = getUser(req);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { phone, city, address, postalCode } = await req.json();

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { phone, city, address, postalCode },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      city: true,
      address: true,
      postalCode: true,
    },
  });

  return NextResponse.json(updated);
}
