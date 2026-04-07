import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

// One-time seed endpoint — remove this file after creating test accounts
export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  const adminPassword = await bcrypt.hash("admin123", 12);
  const clientPassword = await bcrypt.hash("client123", 12);

  const admin = await (prisma as any).user.upsert({
    where: { email: "admin@ia-store.com" },
    update: { role: "ADMIN" },
    create: {
      email: "admin@ia-store.com",
      name: "Admin",
      password: adminPassword,
      role: "ADMIN",
    },
  });

  const client = await (prisma as any).user.upsert({
    where: { email: "client@ia-store.com" },
    update: { role: "CLIENT" },
    create: {
      email: "client@ia-store.com",
      name: "Client Test",
      password: clientPassword,
      role: "CLIENT",
    },
  });

  return NextResponse.json({
    message: "Comptes créés avec succès",
    accounts: [
      { email: admin.email, role: admin.role, password: "admin123" },
      { email: client.email, role: client.role, password: "client123" },
    ],
  });
}
