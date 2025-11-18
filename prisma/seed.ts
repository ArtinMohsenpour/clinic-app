// prisma/seed.ts
import { prisma } from "@/lib/prisma";
import { ROLES } from "@/config/constants/roles";
import { hash } from "bcryptjs";

async function seedAdminUser() {
  console.log("→ Upserting admin user...");

  const adminRole = await prisma.role.findUnique({
    where: { key: "admin" }, // This key comes from your ROLES constant { id: "admin", ... }
    select: { id: true },
  });

  if (!adminRole) {
    console.error(
      "  - 🛑 ERROR: 'admin' role not found. Make sure it's in your ROLES constant and `seedRoles` ran first."
    );
    return;
  }

  const hashedPassword = await hash("password123", 12);
  const adminEmail = "admin@clinic.com";
  const adminName = "Admin User";
  const adminUserId = "cl-admin-0000-0000-0000-000000000001"; // Static User ID

  try {
    const adminUser = await prisma.user.upsert({
      where: { email: adminEmail },
      update: {
        name: adminName,
        emailVerified: true,
        isActive: true,
      },
      create: {
        id: adminUserId, // Static ID for User
        email: adminEmail,
        name: adminName,
        emailVerified: true,
        isActive: true,
        mustChangePassword: false,
        accounts: {
          create: [
            {
              // --- THIS BLOCK IS NOW CORRECTED ---
              id: "cl-admin-acct-0000-0000-000000000001", // Static ID for Account
              providerId: "credential", // FIX: Was 'credentials', changed to 'email' to match your auth route
              accountId: adminEmail,
              password: hashedPassword,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
        },
        roles: {
          create: {
            role: {
              connect: {
                id: adminRole.id,
              },
            },
          },
        },
      },
      include: {
        roles: true,
      },
    });
    console.log(`  - ✓ Admin User: ${adminUser.email} (Pass: password123)`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    console.error(`  - 🛑 ERROR seeding admin user: ${e.message}`);
  }
}

/**
 * Seeds the `Role` table with all available roles.
 */
async function seedRoles() {
  console.log(`→ Upserting ${ROLES.length} roles…`);

  for (const r of ROLES) {
    try {
      await prisma.role.upsert({
        where: { key: r.id }, // Use `id` from ROLES as the `key`
        update: {
          name: r.name,
        },
        create: {
          key: r.id,
          name: r.name,
        },
      });
      console.log(`    ✓ role: ${r.id} (${r.name})`);
    } catch (e) {
      console.error(
        `     ✗ role: ${r.id} — ${e instanceof Error ? e.message : String(e)}`
      );
    }
  }
}

/**
 * Main seed function
 */
async function main() {
  console.log("🔄 Seeding started…");

  // 1. Seed Roles (must be done first)
  await seedRoles();

  // 2. Seed Admin User (depends on roles)
  await seedAdminUser();

  console.log("✅ Seeding finished.");
}

main()
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });