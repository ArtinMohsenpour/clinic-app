import { SignUpForm } from "@/components/auth/signup-form";
import { prisma } from "@/lib/prisma";

export default async function SignupPage() {
  const roles = await prisma.role.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" }, // optional sorting
  });
  return <SignUpForm roles={roles} />;
}
