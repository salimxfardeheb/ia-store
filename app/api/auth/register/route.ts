import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/auth";
import { apiError, handleDbError } from "@/lib/validation";

const registerSchema = z.object({
  email:    z.string().email("Email invalide"),
  name:     z.string().min(1, "Nom requis").max(200),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(
      "VALIDATION_ERROR",
      parsed.error.issues[0]?.message ?? "Données invalides",
      400
    );
  }

  const { email, name, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return apiError("DUPLICATE", "Email déjà utilisé", 409);
  }

  try {
    const hashed = await bcrypt.hash(password, 12);
    const user   = await prisma.user.create({
      data:   { email, name, password: hashed },
      select: { id: true, email: true, name: true, role: true },
    });

    const token = signToken({
      id:    user.id,
      email: user.email,
      name:  user.name,
      role:  user.role as "ADMIN" | "SELLER" | "CLIENT",
    });

    return NextResponse.json({ token, user }, { status: 201 });
  } catch (err) {
    return handleDbError(err);
  }
}
