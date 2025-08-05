import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
 
export  default async function adminDashboard() {
  const session = await auth.api.getSession({
    headers: await headers()
})

if(!session) {
    redirect("/login")
}
const user = await prisma.user.findUnique({
  where: {
    email: session.user.email, // ✅ Fetch by email
  },
  select: {
    name: true,
    role: true,
  },
});

if (!user) {
  redirect("/login"); // or handle gracefully
}
  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      این صفحه درباره admin dashboard است
    {session ? (<p>{session.user.name}</p>): ""}
    {session ? (<p>{session.user.email}</p>): ""}
    {session ? (<p>{session.user.id}</p>): ""}
    {user.role ? <p>{user.role.name}</p> : <p>بدون نقش</p>}
    </div>
  );
}
