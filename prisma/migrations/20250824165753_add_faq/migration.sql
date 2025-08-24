-- CreateTable
CREATE TABLE "public"."faq" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" JSONB NOT NULL,
    "status" "public"."PublishStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "authorId" TEXT NOT NULL,
    "updatedById" TEXT,
    "views" INTEGER NOT NULL DEFAULT 0,
    "helpfulYes" INTEGER NOT NULL DEFAULT 0,
    "helpfulNo" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "faq_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."faq_tag" (
    "faqId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "faq_tag_pkey" PRIMARY KEY ("faqId","tagId")
);

-- CreateTable
CREATE TABLE "public"."faq_category" (
    "faqId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "faq_category_pkey" PRIMARY KEY ("faqId","categoryId")
);

-- CreateIndex
CREATE UNIQUE INDEX "faq_slug_key" ON "public"."faq"("slug");

-- CreateIndex
CREATE INDEX "faq_status_publishedAt_idx" ON "public"."faq"("status", "publishedAt");

-- CreateIndex
CREATE INDEX "faq_order_idx" ON "public"."faq"("order");

-- AddForeignKey
ALTER TABLE "public"."faq" ADD CONSTRAINT "faq_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."faq" ADD CONSTRAINT "faq_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "public"."user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."faq_tag" ADD CONSTRAINT "faq_tag_faqId_fkey" FOREIGN KEY ("faqId") REFERENCES "public"."faq"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."faq_tag" ADD CONSTRAINT "faq_tag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "public"."tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."faq_category" ADD CONSTRAINT "faq_category_faqId_fkey" FOREIGN KEY ("faqId") REFERENCES "public"."faq"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."faq_category" ADD CONSTRAINT "faq_category_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
