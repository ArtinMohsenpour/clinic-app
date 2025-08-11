// scripts/fix-credential-account.ts
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const PROVIDER_ID = "email"; // BetterAuth signIn.email -> providerId = "email"

async function main() {
  const rawEmail = process.argv[2];
  const rawPassword = process.argv[3];
  if (!rawEmail || !rawPassword) {
    console.error(
      "Usage: npx tsx scripts/fix-credential-account.ts <email> <password>"
    );
    process.exit(1);
  }

  const email = rawEmail.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error(`No user with email ${email}`);

  const hash = await bcrypt.hash(rawPassword, await bcrypt.genSalt(10));

  await prisma.account.upsert({
    where: {
      providerId_accountId: { providerId: PROVIDER_ID, accountId: email },
    },
    update: { password: hash, updatedAt: new Date() },
    create: {
      id: crypto.randomUUID(),
      userId: user.id,
      providerId: PROVIDER_ID,
      accountId: email,
      password: hash,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  console.log(`✓ Credentials ready for ${email} (providerId=${PROVIDER_ID})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
