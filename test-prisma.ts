import { PrismaClient } from "./app/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

async function test() {
  const adapter = new PrismaLibSql({ url: "file:./dev.db" });
  const prisma = new (PrismaClient as any)({ adapter });
  console.log("PrismaClient created OK");
  const count = await (prisma as any).user.count();
  console.log("User count:", count);
  await (prisma as any).$disconnect();
}

test().catch(e => {
  console.error("ERROR:", e.message);
  process.exit(1);
});
