// app/admin/profile/page.tsx
import ProfileClient from "@/components/admin/profile/profile-client";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  // ✅ pass context
  const raw = await headers();
  const session = await auth.api.getSession({ headers: raw });

  if (!session?.user) {
    redirect("/login?next=/admin/profile");
  }

  return <ProfileClient />;
}
