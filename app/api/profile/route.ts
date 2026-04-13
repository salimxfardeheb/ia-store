import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTokenFromHeader, verifyToken } from "@/lib/auth";
import { profileUpdateSchema, safeParse, handleDbError } from "@/lib/validation";

function getUser(req: NextRequest) {
  const token = getTokenFromHeader(req.headers.get("Authorization"));
  if (!token) return null;
  return verifyToken(token);
}

const PROFILE_SELECT = {
  id: true, email: true, name: true,
  phone: true, city: true, address: true, postalCode: true,
} as const;

// GET /api/profile
export async function GET(req: NextRequest) {
  const user = getUser(req);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  try {
    const profile = await prisma.user.findUnique({
      where:  { id: user.id },
      select: PROFILE_SELECT,
    });
    return NextResponse.json(profile);
  } catch (err) {
    return handleDbError(err);
  }
}

// PATCH /api/profile
export async function PATCH(req: NextRequest) {
  const user = getUser(req);
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const [data, err] = safeParse(profileUpdateSchema, body);
  if (err) return err;

  try {
    const updated = await prisma.user.update({
      where:  { id: user.id },
      data,
      select: PROFILE_SELECT,
    });
    return NextResponse.json(updated);
  } catch (err) {
    return handleDbError(err);
  }
}
