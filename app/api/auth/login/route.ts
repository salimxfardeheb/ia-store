import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Champs manquants" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json({ error: "Identifiants incorrects" }, { status: 401 });
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return NextResponse.json({ error: "Identifiants incorrects" }, { status: 401 });
  }

  const token = signToken({ id: user.id, email: user.email, name: user.name, role: user.role as "ADMIN" | "CLIENT" });

  return NextResponse.json({
    token,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  });
}
