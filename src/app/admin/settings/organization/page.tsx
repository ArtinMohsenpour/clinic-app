// app/admin/settings/organization/page.tsx
import { redirect } from "next/navigation";

export default function OrgIndex() {
  redirect("/admin/settings/organization/branches");
}
