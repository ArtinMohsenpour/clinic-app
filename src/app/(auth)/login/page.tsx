import { LoginForm } from "@/components/auth/login-form";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  const raw = await headers();
  const session = await auth.api.getSession({ headers: raw });
  const user = session?.user;

  if (user) redirect("/");

  return <LoginForm />;
}
