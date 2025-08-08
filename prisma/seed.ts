// prisma/seed.js
import pkg from "@prisma/client";
const { PrismaClient } = pkg;
import { ROLES } from "../src/config/constants/roles";

const prisma = new PrismaClient();

async function seedRoles() {
  for (const role of ROLES) {
    await prisma.role.upsert({
      where: { id: role.id },
      update: { name: role.name }, // update Persian name if changed
      create: role,
    });
  }
  console.log("✅ Roles seeded.");
}

async function main() {
  await seedRoles();
}

main()
  .then(() => console.log("🎉 Seeding completed."))
  .catch((e) => console.error("❌ Seeding error:", e))
  .finally(() => prisma.$disconnect());
