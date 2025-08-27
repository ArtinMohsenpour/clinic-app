-- CreateTable
CREATE TABLE "public"."branch_cms" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "status" "public"."PublishStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "title" TEXT,
    "subtitle" TEXT,
    "body" JSONB,
    "publicAddress" TEXT,
    "phonePrimary" TEXT,
    "phoneSecondary" TEXT,
    "emailPublic" TEXT,
    "mapUrl" TEXT,
    "openingHours" JSONB,
    "heroId" TEXT,
    "authorId" TEXT NOT NULL,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "branch_cms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."branch_media" (
    "branchCmsId" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "branch_media_pkey" PRIMARY KEY ("branchCmsId","mediaId")
);

-- CreateTable
CREATE TABLE "public"."news_branch" (
    "newsId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,

    CONSTRAINT "news_branch_pkey" PRIMARY KEY ("newsId","branchId")
);

-- CreateIndex
CREATE UNIQUE INDEX "branch_cms_branchId_key" ON "public"."branch_cms"("branchId");

-- CreateIndex
CREATE INDEX "branch_cms_status_publishedAt_idx" ON "public"."branch_cms"("status", "publishedAt");

-- CreateIndex
CREATE INDEX "branch_media_branchCmsId_order_idx" ON "public"."branch_media"("branchCmsId", "order");

-- CreateIndex
CREATE INDEX "news_branch_branchId_idx" ON "public"."news_branch"("branchId");

-- CreateIndex
CREATE INDEX "news_branch_newsId_idx" ON "public"."news_branch"("newsId");

-- AddForeignKey
ALTER TABLE "public"."branch_cms" ADD CONSTRAINT "branch_cms_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "public"."branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."branch_cms" ADD CONSTRAINT "branch_cms_heroId_fkey" FOREIGN KEY ("heroId") REFERENCES "public"."media_asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."branch_cms" ADD CONSTRAINT "branch_cms_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."branch_cms" ADD CONSTRAINT "branch_cms_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "public"."user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."branch_media" ADD CONSTRAINT "branch_media_branchCmsId_fkey" FOREIGN KEY ("branchCmsId") REFERENCES "public"."branch_cms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."branch_media" ADD CONSTRAINT "branch_media_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "public"."media_asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."news_branch" ADD CONSTRAINT "news_branch_newsId_fkey" FOREIGN KEY ("newsId") REFERENCES "public"."news"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."news_branch" ADD CONSTRAINT "news_branch_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "public"."branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
