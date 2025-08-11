// app/admin/[...slug]/page.tsx
import { notFound } from "next/navigation";

export default function AdminCatchAll() {
  notFound(); // renders app/admin/not-found.tsx if it exists
}
