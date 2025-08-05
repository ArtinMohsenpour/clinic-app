// prisma/seed.ts

import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed..."); // Debug: Confirm it runs

  const roles = [
    "admin",
    "ceo",
    "doctor",
    "nurse",
    "it manager",
    "content creator",
  ];

  for (const name of roles) {
    await prisma.role.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    console.log(`→ role created or exists: ${name}`);
  }

  console.log("✅ Roles seeded");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());