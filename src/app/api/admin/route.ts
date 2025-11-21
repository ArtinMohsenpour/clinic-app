/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

const ACTIVITY_ROLES = new Set([
  "it_manager",
  "ceo",
  "internal_manager",
  "admin",
]);

export async function GET(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const me = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { roles: { select: { role: { select: { key: true } } } } },
    });
    const roleKeys = new Set((me?.roles ?? []).map((r) => r.role.key));
    const canViewActivity = Array.from(roleKeys).some((k) =>
      ACTIVITY_ROLES.has(k)
    );

    const [
      // Content Group
      articles,
      news,
      education,
      faq,
      forms,
      // Clinic Data Group
      branches,
      services,
      insurance,
      schedules,
      departments,
      // Site Group
      hero,
      staticPages,
      // Operations Group
      careers,
      users, // <--- NEW: Staff count
      // Review Queue & Logs
      draftArticles,
      draftNews,
      draftEducation,
      draftFaq,
      draftBranches,
      draftForms,
      draftServices,
      draftInsurance,
      draftHero,
      draftPages,
      draftCareers,
      auditLogs,
    ] = await Promise.all([
      // Content
      getPublishStats(prisma.article),
      getPublishStats(prisma.news),
      getPublishStats(prisma.education),
      getPublishStats(prisma.faq),
      getPublishStats(prisma.formFile),
      // Clinic
      getPublishStats(prisma.branchCMS),
      getPublishStats(prisma.service),
      getPublishStats(prisma.insuranceCompany),
      prisma.schedule.count().then(async (total) => ({
        total,
        drafts: 0,
        published: await prisma.scheduleEntry.count(),
      })),
      prisma.department.count().then((total) => ({
        total,
        drafts: 0,
        published: total,
      })),
      // Site
      getPublishStats(prisma.heroSlide),
      getPublishStats(prisma.staticPage),
      // Operations
      prisma.career.count().then(async (total) => ({
        total,
        drafts: await prisma.career.count({ where: { status: "DRAFT" } }),
        published: await prisma.career.count({ where: { status: "OPEN" } }),
      })),
      // --- NEW: User/Staff Stats ---
      prisma.user.count().then(async (total) => ({
        total,
        drafts: 0, // N/A for users
        published: await prisma.user.count({ where: { isActive: true } }), // Active users
      })),

      // Review Queues
      getRecentDrafts(prisma.article, "article", "title"),
      getRecentDrafts(prisma.news, "news", "title"),
      getRecentDrafts(prisma.education, "education", "title"),
      getRecentDrafts(prisma.faq, "faq", "question"),
      getRecentDrafts(prisma.branchCMS, "branches", "title"),
      getRecentDrafts(prisma.formFile, "forms", "title"),
      getRecentDrafts(prisma.service, "services", "title"),
      getRecentDrafts(prisma.insuranceCompany, "insurance", "name"),
      getRecentDrafts(prisma.heroSlide, "hero", "title"),
      getRecentDrafts(prisma.staticPage, "static-pages", "title"),
      getRecentDrafts(prisma.career, "careers", "title"),

      // Activity
      canViewActivity
        ? prisma.auditLog.findMany({
            take: 10,
            orderBy: { createdAt: "desc" },
            select: { id: true, action: true, createdAt: true },
          })
        : [],
    ]);

    const rawReviewQueue = [
      ...draftArticles,
      ...draftNews,
      ...draftEducation,
      ...draftFaq,
      ...draftBranches,
      ...draftForms,
      ...draftServices,
      ...draftInsurance,
      ...draftHero,
      ...draftPages,
      ...draftCareers,
    ];

    const reviewQueue = rawReviewQueue
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      )
      .slice(0, 10);

    return NextResponse.json({
      articles,
      news,
      education,
      faq,
      forms,
      branches,
      services,
      insurance,
      schedules,
      departments,
      hero,
      "static-pages": staticPages,
      careers,
      users, // <--- Return this
      reviewQueue,
      recentActivity: auditLogs.map((log) => ({
        id: log.id,
        action: log.action,
        createdAt: log.createdAt.toISOString(),
      })),
      canViewActivity,
    });
  } catch (error) {
    console.error("Admin Dashboard API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// --- Helpers ---
async function getPublishStats(model: any) {
  const [total, drafts, published] = await Promise.all([
    model.count(),
    model.count({ where: { status: "DRAFT" } }),
    model.count({ where: { status: "PUBLISHED" } }),
  ]);
  return { total, drafts, published };
}

async function getRecentDrafts(
  model: any,
  typeKey: string,
  titleField: string
) {
  const items = await model.findMany({
    where: { status: "DRAFT" },
    orderBy: { updatedAt: "desc" },
    take: 5,
    select: {
      id: true,
      [titleField]: true,
      updatedAt: true,
    },
  });

  return items.map((item: any) => ({
    id: item.id,
    title: item[titleField] || "(No Title)",
    type: typeKey,
    updatedAt: item.updatedAt.toISOString(),
  }));
}
