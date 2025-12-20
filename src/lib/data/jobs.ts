import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import { CareerStatus, ContactItemType } from "@prisma/client";

export const getCareersPageData = unstable_cache(
  async () => {
    // 1. Fetch Open Jobs (واکشی شغل‌های باز)
    const jobsPromise = prisma.career.findMany({
      where: {
        status: CareerStatus.OPEN,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // 2. Fetch Contact Email from Static Page (واکشی ایمیل از صفحه تماس با ما)
    const contactPromise = prisma.staticPage.findUnique({
      where: { slug: "contact-us" },
      include: {
        contactItems: {
          where: {
            // فقط آیتم‌هایی که از نوع ایمیل هستند را بگیر
            type: ContactItemType.EMAIL,
          },
          orderBy: {
            order: "asc",
          },
          take: 1, // فقط اولین ایمیل کافیست
        },
      },
    });

    // اجرای همزمان برای پرفورمنس بهتر
    const [jobs, contactPage] = await Promise.all([
      jobsPromise,
      contactPromise,
    ]);

    // استخراج ایمیل یا استفاده از پیش‌فرض
    const email =
      contactPage?.contactItems?.[0]?.value || "jobs@asr-clinic.com";

    return { jobs, email };
  },
  ["public-careers-page-data"], // Cache Key
  { tags: ["careers", "jobs", "static-pages", "contact-us"] } // Revalidation Tags
);
