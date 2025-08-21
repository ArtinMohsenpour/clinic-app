import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { STAFF_MANAGEMENT_ALLOWED_ROLES } from "@/config/constants/rbac";

export const dynamic = "force-dynamic"; // no caching
export const revalidate = 0;

async function requireCMS(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  const can = await prisma.user.findFirst({
    where: {
      id: session.user.id,
      roles: {
        some: {
          role: { key: { in: Array.from(STAFF_MANAGEMENT_ALLOWED_ROLES) } },
        },
      },
    },
    select: { id: true },
  });
  if (!can)
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  return { session };
}

export async function GET(req: Request) {
  const gate = await requireCMS(req);
  if ("error" in gate) return gate.error;

  const [
    articlesTotal,
    articlesDrafts,
    articlesPublished,
    reviewArticles,
    activity,
  ] = await prisma.$transaction([
    prisma.article.count(),
    prisma.article.count({ where: { status: "DRAFT" } }),
    prisma.article.count({ where: { status: "PUBLISHED" } }),
    prisma.article.findMany({
      where: { OR: [{ status: "DRAFT" }, { status: "SCHEDULED" }] },
      orderBy: { updatedAt: "desc" },
      take: 8,
      select: { id: true, title: true, status: true, updatedAt: true },
    }),
    prisma.auditLog.findMany({
      where: {
        action: {
          in: [
            "CMS_ARTICLE_CREATE",
            "CMS_ARTICLE_UPDATE",
            "CMS_ARTICLE_DELETE",
          ],
        },
      },
      orderBy: { createdAt: "desc" },
      take: 12,
      select: { id: true, action: true, createdAt: true },
    }),
  ]);

  return NextResponse.json({
    // Only return keys you actually compute; the UI handles partials
    articles: {
      total: articlesTotal,
      drafts: articlesDrafts,
      published: articlesPublished,
    },
    reviewQueue: reviewArticles.map((a) => ({
      id: a.id,
      title: a.title,
      type: "article",
      updatedAt: a.updatedAt.toISOString(),
    })),
    recentActivity: activity.map((e) => ({
      id: e.id,
      action: e.action,
      createdAt: e.createdAt.toISOString(),
    })),
  });
}
