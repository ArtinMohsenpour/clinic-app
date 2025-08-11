// prisma/seed.ts
import { prisma } from "@/lib/prisma";
import { ROLES } from "@/config/constants/roles";

async function main() {
  console.log("🔄 Seeding started…");

  console.log(`→ Upserting ${ROLES.length} roles…`);
  let created = 0;
  const updated = 0;

  for (const r of ROLES) {
    try {
      const res = await prisma.role.upsert({
        where: { key: r.id }, // requires key @unique
        update: { name: r.name },
        create: { id: crypto.randomUUID(), key: r.id, name: r.name },
      });
      // Heuristic: if name matches exactly we can’t tell created vs updated by API,
      // so do a quick check by querying back (optional). Simpler: log the key.
      console.log(`   ✓ role: ${r.id} (${r.name})`);
      created++; // if you want real created/updated counts, do a findFirst before upsert
    } catch (e) {
      console.error(
        `   ✗ role: ${r.id} — ${e instanceof Error ? e.message : String(e)}`
      );
    }
  }

  // If you later add default users, do it here…
  // console.log("→ Creating default admin user…");

  console.log("✅ Seeding finished.");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
