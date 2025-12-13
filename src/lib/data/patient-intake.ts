import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";

// Fetch the static "Patient Intake" page content
export const getPatientIntakePageData = unstable_cache(
  async () => {
    return prisma.staticPage.findUnique({
      where: { slug: "patient-intake" },
    });
  },
  ["patient-intake-page-data"],
  { tags: ["static-pages", "patient-intake-page"] }
);
