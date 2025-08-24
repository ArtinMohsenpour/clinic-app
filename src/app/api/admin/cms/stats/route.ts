import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// roles allowed to see Recent Activity widget
const ACTIVITY_ROLES = new Set([
  "it_manager",
  "ceo",
  "internal_manager",
  "admin",
]);

export async function GET(req: Request) {
  // auth (soft): anyone signed-in can read CMS stats
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // fetch role keys to compute activity visibility
  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { roles: { select: { role: { select: { key: true } } } } },
  });
  const roleKeys = new Set((me?.roles ?? []).map((r) => r.role.key));
  const canViewActivity = Array.from(roleKeys).some((k) =>
    ACTIVITY_ROLES.has(k)
  );

  // counts
  const [
    // Articles
    articlesTotal,
    articlesDrafts,
    articlesPublished,
    // News
    newsTotal,
    newsDrafts,
    newsPublished,
    // Education
    eduTotal,
    eduDrafts,
    eduPublished,
    // FAQ
    faqTotal,
    faqDrafts,
    faqPublished,
    // Review queue (latest edited items needing attention)
    reviewArticles,
    reviewNews,
    reviewEdu,
    reviewFaq,
    // Recent activity (audit logs)
    activity,
  ] = await Promise.all([
    // Articles
    prisma.article.count(),
    prisma.article.count({ where: { status: "DRAFT" } }),
    prisma.article.count({ where: { status: "PUBLISHED" } }),

    // News
    prisma.news.count(),
    prisma.news.count({ where: { status: "DRAFT" } }),
    prisma.news.count({ where: { status: "PUBLISHED" } }),

    // Education
    prisma.education.count(),
    prisma.education.count({ where: { status: "DRAFT" } }),
    prisma.education.count({ where: { status: "PUBLISHED" } }),

    // FAQ
    prisma.faq.count(),
    prisma.faq.count({ where: { status: "DRAFT" } }),
    prisma.faq.count({ where: { status: "PUBLISHED" } }),

    // Review queues: top 8 recently updated drafts/scheduled
    prisma.article.findMany({
      where: { status: { in: ["DRAFT", "SCHEDULED"] } },
      orderBy: { updatedAt: "desc" },
      take: 8,
      select: { id: true, title: true, updatedAt: true },
    }),
    prisma.news.findMany({
      where: { status: { in: ["DRAFT", "SCHEDULED"] } },
      orderBy: { updatedAt: "desc" },
      take: 8,
      select: { id: true, title: true, updatedAt: true },
    }),
    prisma.education.findMany({
      where: { status: { in: ["DRAFT", "SCHEDULED"] } },
      orderBy: { updatedAt: "desc" },
      take: 8,
      select: { id: true, title: true, updatedAt: true },
    }),
    prisma.faq.findMany({
      where: { status: { in: ["DRAFT", "SCHEDULED"] } },
      orderBy: { updatedAt: "desc" },
      take: 8,
      select: { id: true, question: true, updatedAt: true },
    }),

    // Recent activity (limit)
    canViewActivity
      ? prisma.auditLog.findMany({
          where: { action: { startsWith: "CMS_" } },
          orderBy: { createdAt: "desc" },
          take: 10,
          select: { id: true, action: true, createdAt: true },
        })
      : Promise.resolve(
          [] as Array<{ id: string; action: string; createdAt: Date }>
        ),
  ]);

  const reviewQueue = [
    ...reviewArticles.map((a) => ({
      id: a.id,
      title: a.title,
      type: "article",
      updatedAt: a.updatedAt.toISOString(),
    })),
    ...reviewNews.map((n) => ({
      id: n.id,
      title: n.title,
      type: "news",
      updatedAt: n.updatedAt.toISOString(),
    })),
    ...reviewEdu.map((e) => ({
      id: e.id,
      title: e.title,
      type: "education",
      updatedAt: e.updatedAt.toISOString(),
    })),
    ...reviewFaq.map((f) => ({
      id: f.id,
      title: f.question,
      type: "faq",
      updatedAt: f.updatedAt.toISOString(),
    })),
  ]
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
    .slice(0, 8);

  return NextResponse.json({
    // module summaries (what your UI reads)
    articles: {
      total: articlesTotal,
      drafts: articlesDrafts,
      published: articlesPublished,
    },
    news: { total: newsTotal, drafts: newsDrafts, published: newsPublished },
    education: { total: eduTotal, drafts: eduDrafts, published: eduPublished },
    faq: { total: faqTotal, drafts: faqDrafts, published: faqPublished },

    // widgets
    reviewQueue,
    recentActivity: activity.map((e) => ({
      id: e.id,
      action: e.action,
      createdAt: e.createdAt.toISOString(),
    })),
    canViewActivity,
  });
}
