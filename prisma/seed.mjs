import { PrismaClient } from "../app/generated/prisma/index.js";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

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
