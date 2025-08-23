// src/app/api/admin/cms/stats/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import {
  CMS_ALLOWED_ROLES,
  ACTIVITY_ALLOWED_ROLES,
} from "@/config/constants/rbac";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function requireCMS(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  const canUseCMS = await prisma.user.findFirst({
    where: {
      id: session.user.id,
      roles: { some: { role: { key: { in: Array.from(CMS_ALLOWED_ROLES) } } } },
    },
    select: { id: true },
  });
  if (!canUseCMS) {
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }
  return { session };
}

export async function GET(req: Request) {
  const gate = await requireCMS(req);
  if ("error" in gate) return gate.error;
  const { session } = gate;

  const canActivity = await prisma.user.findFirst({
    where: {
      id: session.user.id,
      roles: {
        some: { role: { key: { in: Array.from(ACTIVITY_ALLOWED_ROLES) } } },
      },
    },
    select: { id: true },
  });

  const [
    articlesTotal,
    articlesDrafts,
    articlesPublished,
    newsTotal,
    newsDrafts,
    newsPublished,
    eduTotal,
    eduDrafts,
    eduPublished,
    reviewArticles,
    recentActivityRaw,
  ] = await prisma.$transaction([
    prisma.article.count(),
    prisma.article.count({ where: { status: "DRAFT" } }),
    prisma.article.count({ where: { status: "PUBLISHED" } }),

    prisma.news.count(),
    prisma.news.count({ where: { status: "DRAFT" } }),
    prisma.news.count({ where: { status: "PUBLISHED" } }),

    prisma.education.count(),
    prisma.education.count({ where: { status: "DRAFT" } }),
    prisma.education.count({ where: { status: "PUBLISHED" } }),

    prisma.article.findMany({
      where: { OR: [{ status: "DRAFT" }, { status: "SCHEDULED" }] },
      orderBy: { updatedAt: "desc" },
      take: 8,
      select: { id: true, title: true, updatedAt: true },
    }),

    // Only fetch if allowed; otherwise cheap empty query
    canActivity
      ? prisma.auditLog.findMany({
          where: {
            action: {
              in: [
                "CMS_ARTICLE_CREATE",
                "CMS_ARTICLE_UPDATE",
                "CMS_ARTICLE_DELETE",
                "CMS_NEWS_CREATE",
                "CMS_NEWS_UPDATE",
                "CMS_NEWS_DELETE",
                "CMS_EDU_CREATE",
                "CMS_EDU_UPDATE",
                "CMS_EDU_DELETE",
              ],
            },
          },
          orderBy: { createdAt: "desc" },
          take: 12,
          select: { id: true, action: true, createdAt: true },
        })
      : prisma.auditLog.findMany({ take: 0 }),
  ]);

  return NextResponse.json({
    articles: {
      total: articlesTotal,
      drafts: articlesDrafts,
      published: articlesPublished,
    },
    news: { total: newsTotal, drafts: newsDrafts, published: newsPublished },
    education: { total: eduTotal, drafts: eduDrafts, published: eduPublished },

    reviewQueue: reviewArticles.map((a) => ({
      id: a.id,
      title: a.title,
      type: "article",
      updatedAt: a.updatedAt.toISOString(),
    })),

    canViewActivity: Boolean(canActivity),
    recentActivity: (canActivity ? recentActivityRaw : []).map((e) => ({
      id: e.id,
      action: e.action,
      createdAt: e.createdAt.toISOString(),
    })),
  });
}
