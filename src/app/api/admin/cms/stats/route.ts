import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const ACTIVITY_ROLES = new Set([
  "it_manager",
  "ceo",
  "internal_manager",
  "admin",
]);

export async function GET(req: Request) {
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
    // BranchCMS
    branchesTotal,
    branchesDrafts,
    branchesPublished,
    // Forms (FormFile)
    formsTotal,
    formsDrafts,
    formsPublished,
    // Services
    servicesTotal,
    servicesDrafts,
    servicesPublished,
    // InsuranceCompanies
    insurancesTotal,
    insurancesDrafts,
    insurancesPublished,
    // Schedules
    schedulesTotal,
    scheduleEntriesTotal,
    // Hero Slides
    heroSlidesTotal,
    heroSlidesDrafts,
    heroSlidesPublished,
    // Static Pages
    pagesTotal,
    pagesDrafts,
    pagesPublished,
    // Careers
    careersTotal,
    careersDrafts,
    careersPublished,

    // Review queues
    reviewArticles,
    reviewNews,
    reviewEdu,
    reviewFaq,
    reviewBranches,
    reviewForms,
    reviewServices,
    reviewInsurances,
    reviewHeroSlides,
    reviewPages,
    reviewCareers,

    // Activity
    activity,
  ] = await Promise.all([
    // ----- counts -----
    prisma.article.count(),
    prisma.article.count({ where: { status: "DRAFT" } }),
    prisma.article.count({ where: { status: "PUBLISHED" } }),

    prisma.news.count(),
    prisma.news.count({ where: { status: "DRAFT" } }),
    prisma.news.count({ where: { status: "PUBLISHED" } }),

    prisma.education.count(),
    prisma.education.count({ where: { status: "DRAFT" } }),
    prisma.education.count({ where: { status: "PUBLISHED" } }),

    prisma.faq.count(),
    prisma.faq.count({ where: { status: "DRAFT" } }),
    prisma.faq.count({ where: { status: "PUBLISHED" } }),

    prisma.branchCMS.count(),
    prisma.branchCMS.count({ where: { status: "DRAFT" } }),
    prisma.branchCMS.count({ where: { status: "PUBLISHED" } }),

    prisma.formFile.count(),
    prisma.formFile.count({ where: { status: "DRAFT" } }),
    prisma.formFile.count({ where: { status: "PUBLISHED" } }),

    prisma.service.count(),
    prisma.service.count({ where: { status: "DRAFT" } }),
    prisma.service.count({ where: { status: "PUBLISHED" } }),

    prisma.insuranceCompany.count(),
    prisma.insuranceCompany.count({ where: { status: "DRAFT" } }),
    prisma.insuranceCompany.count({ where: { status: "PUBLISHED" } }),

    prisma.schedule.count(),
    prisma.scheduleEntry.count(),

    prisma.heroSlide.count(),
    prisma.heroSlide.count({ where: { status: "DRAFT" } }),
    prisma.heroSlide.count({ where: { status: "PUBLISHED" } }),

    prisma.staticPage.count(),
    prisma.staticPage.count({ where: { status: "DRAFT" } }),
    prisma.staticPage.count({ where: { status: "PUBLISHED" } }),

    // Careers counts
    prisma.career.count(),
    prisma.career.count({ where: { status: "DRAFT" } }),
    // For careers, "OPEN" is effectively "PUBLISHED"
    prisma.career.count({ where: { status: "OPEN" } }),

    // ----- review queues -----
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
    prisma.branchCMS.findMany({
      where: { status: { in: ["DRAFT", "SCHEDULED"] } },
      orderBy: { updatedAt: "desc" },
      take: 8,
      select: {
        id: true,
        title: true,
        updatedAt: true,
        branch: { select: { name: true } },
      },
    }),
    prisma.formFile.findMany({
      where: { status: { in: ["DRAFT", "SCHEDULED"] } },
      orderBy: { updatedAt: "desc" },
      take: 8,
      select: { id: true, title: true, updatedAt: true },
    }),
    prisma.service.findMany({
      where: { status: { in: ["DRAFT", "SCHEDULED"] } },
      orderBy: { updatedAt: "desc" },
      take: 8,
      select: { id: true, title: true, updatedAt: true },
    }),
    prisma.insuranceCompany.findMany({
      where: { status: { in: ["DRAFT", "SCHEDULED"] } },
      orderBy: { updatedAt: "desc" },
      take: 8,
      select: { id: true, name: true, updatedAt: true },
    }),
    prisma.heroSlide.findMany({
      where: { status: { in: ["DRAFT", "SCHEDULED"] } },
      orderBy: { updatedAt: "desc" },
      take: 8,
      select: { id: true, title: true, updatedAt: true },
    }),
    prisma.staticPage.findMany({
      where: { status: { in: ["DRAFT", "SCHEDULED"] } },
      orderBy: { updatedAt: "desc" },
      take: 8,
      select: { id: true, title: true, updatedAt: true },
    }),
    // Careers review queue (DRAFT status)
    prisma.career.findMany({
      where: { status: "DRAFT" },
      orderBy: { updatedAt: "desc" },
      take: 8,
      select: { id: true, title: true, updatedAt: true },
    }),

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
      type: "article" as const,
      updatedAt: a.updatedAt.toISOString(),
    })),
    ...reviewNews.map((n) => ({
      id: n.id,
      title: n.title,
      type: "news" as const,
      updatedAt: n.updatedAt.toISOString(),
    })),
    ...reviewEdu.map((e) => ({
      id: e.id,
      title: e.title,
      type: "education" as const,
      updatedAt: e.updatedAt.toISOString(),
    })),
    ...reviewFaq.map((f) => ({
      id: f.id,
      title: f.question,
      type: "faq" as const,
      updatedAt: f.updatedAt.toISOString(),
    })),
    ...reviewBranches.map((b) => ({
      id: b.id,
      title: b.title || b.branch?.name || "Branch page",
      type: "branch" as const,
      updatedAt: b.updatedAt.toISOString(),
    })),
    ...reviewForms.map((ff) => ({
      id: ff.id,
      title: ff.title,
      type: "form" as const,
      updatedAt: ff.updatedAt.toISOString(),
    })),
    ...reviewServices.map((s) => ({
      id: s.id,
      title: s.title,
      type: "service" as const,
      updatedAt: s.updatedAt.toISOString(),
    })),
    ...reviewInsurances.map((i) => ({
      id: i.id,
      title: i.name,
      type: "insurance" as const,
      updatedAt: i.updatedAt.toISOString(),
    })),
    ...reviewHeroSlides.map((s) => ({
      id: s.id,
      title: s.title,
      type: "hero" as const,
      updatedAt: s.updatedAt.toISOString(),
    })),
    ...reviewPages.map((p) => ({
      id: p.id,
      title: p.title,
      type: "page" as const,
      updatedAt: p.updatedAt.toISOString(),
    })),
    ...reviewCareers.map((c) => ({
      id: c.id,
      title: c.title,
      type: "career" as const,
      updatedAt: c.updatedAt.toISOString(),
    })),
  ]
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
    .slice(0, 8);

  return NextResponse.json({
    articles: {
      total: articlesTotal,
      drafts: articlesDrafts,
      published: articlesPublished,
    },
    news: { total: newsTotal, drafts: newsDrafts, published: newsPublished },
    education: { total: eduTotal, drafts: eduDrafts, published: eduPublished },
    faq: { total: faqTotal, drafts: faqDrafts, published: faqPublished },
    branches: {
      total: branchesTotal,
      drafts: branchesDrafts,
      published: branchesPublished,
    },
    forms: {
      total: formsTotal,
      drafts: formsDrafts,
      published: formsPublished,
    },
    services: {
      total: servicesTotal,
      drafts: servicesDrafts,
      published: servicesPublished,
    },
    insurance: {
      total: insurancesTotal,
      drafts: insurancesDrafts,
      published: insurancesPublished,
    },
    schedules: {
      total: schedulesTotal,
      published: scheduleEntriesTotal,
    },
    hero: {
      total: heroSlidesTotal,
      drafts: heroSlidesDrafts,
      published: heroSlidesPublished,
    },
    "static-pages": {
      total: pagesTotal,
      drafts: pagesDrafts,
      published: pagesPublished,
    },
    careers: {
      total: careersTotal,
      drafts: careersDrafts,
      published: careersPublished, // This represents OPEN careers
    },

    reviewQueue,
    recentActivity: activity.map((e) => ({
      id: e.id,
      action: e.action,
      createdAt: e.createdAt.toISOString(),
    })),
    canViewActivity,
  });
}