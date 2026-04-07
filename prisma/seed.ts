import { PrismaClient } from "../app/generated/prisma/client";
import bcrypt from "bcryptjs";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = new (PrismaClient as any)();

async function main() {
  const adminPassword = await bcrypt.hash("admin123", 12);
  const clientPassword = await bcrypt.hash("client123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@ia-store.com" },
    update: { role: "ADMIN" },
    create: {
      email: "admin@ia-store.com",
      name: "Admin",
      password: adminPassword,
      role: "ADMIN",
    },
  });

  const client = await prisma.user.upsert({
    where: { email: "client@ia-store.com" },
    update: { role: "CLIENT" },
    create: {
      email: "client@ia-store.com",
      name: "Client Test",
      password: clientPassword,
      role: "CLIENT",
    },
  });

  console.log("Comptes créés :");
  console.log(`  ADMIN  → ${admin.email}  / admin123`);
  console.log(`  CLIENT → ${client.email} / client123`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
