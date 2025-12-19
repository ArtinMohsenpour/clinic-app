// src/lib/data/contact.ts
import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";

export const getContactUsPageData = unstable_cache(
  async () => {
    return prisma.staticPage.findUnique({
      where: { slug: "contact-us" }, // واکشی بر اساس اسلاگ contact-us
      include: {
        contactItems: {
          orderBy: { order: "asc" }, // مرتب‌سازی آیتم‌های تماس
        },
      },
    });
  },
  ["contact-page-data"],
  { tags: ["static-pages", "contact-page"] }
);
