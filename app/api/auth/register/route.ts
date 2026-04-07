import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { email, name, password } = await req.json();

  if (!email || !name || !password) {
    return NextResponse.json({ error: "Champs manquants" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Email déjà utilisé" }, { status: 409 });
  }

  const hashed = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: { email, name, password: hashed },
    select: { id: true, email: true, name: true, role: true },
  });

  const token = signToken({ id: user.id, email: user.email, name: user.name, role: user.role as "ADMIN" | "CLIENT" });

  return NextResponse.json({ token, user }, { status: 201 });
}
