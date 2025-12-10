// src/app/api/admin/cms/news/options/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCmsAccess } from "../../_auth";
import { revalidateTag } from "next/cache";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// GET a simplified list of news articles for select dropdowns
export async function GET(req: Request) {
  const gate = await requireCmsAccess(req);
  if ("error" in gate) return gate.error;

  const newsOptions = await prisma.news.findMany({
    where: {
      status: "PUBLISHED", // Only show published news as options
    },
    orderBy: {
      publishedAt: "desc",
    },
    select: {
      id: true,
      title: true,
    },
  });

   revalidateTag("home-hero");

  return NextResponse.json(newsOptions);
}
