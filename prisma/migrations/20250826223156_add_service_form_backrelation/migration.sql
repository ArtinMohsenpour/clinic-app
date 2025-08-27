-- AlterTable
ALTER TABLE "public"."user" ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "public"."service" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "excerpt" TEXT,
    "body" JSONB,
    "status" "public"."PublishStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "coverId" TEXT,
    "authorId" TEXT NOT NULL,
    "updatedById" TEXT,
    "iconKey" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "bookingEnabled" BOOLEAN NOT NULL DEFAULT false,
    "durationMin" INTEGER,
    "priceMin" INTEGER,
    "priceMax" INTEGER,
    "priceCurrency" TEXT,
    "preparation" JSONB,
    "aftercare" JSONB,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."service_tag" (
    "serviceId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "service_tag_pkey" PRIMARY KEY ("serviceId","tagId")
);

-- CreateTable
CREATE TABLE "public"."service_category" (
    "serviceId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "service_category_pkey" PRIMARY KEY ("serviceId","categoryId")
);

-- CreateTable
CREATE TABLE "public"."service_media" (
    "serviceId" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "service_media_pkey" PRIMARY KEY ("serviceId","mediaId")
);

-- CreateTable
CREATE TABLE "public"."service_branch" (
    "serviceId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,

    CONSTRAINT "service_branch_pkey" PRIMARY KEY ("serviceId","branchId")
);

-- CreateTable
CREATE TABLE "public"."service_form_file" (
    "serviceId" TEXT NOT NULL,
    "formFileId" TEXT NOT NULL,

    CONSTRAINT "service_form_file_pkey" PRIMARY KEY ("serviceId","formFileId")
);

-- CreateIndex
CREATE UNIQUE INDEX "service_slug_key" ON "public"."service"("slug");

-- CreateIndex
CREATE INDEX "service_status_publishedAt_idx" ON "public"."service"("status", "publishedAt");

-- CreateIndex
CREATE INDEX "service_order_idx" ON "public"."service"("order");

-- CreateIndex
CREATE INDEX "service_media_serviceId_order_idx" ON "public"."service_media"("serviceId", "order");

-- CreateIndex
CREATE INDEX "service_branch_branchId_idx" ON "public"."service_branch"("branchId");

-- CreateIndex
CREATE INDEX "service_branch_serviceId_idx" ON "public"."service_branch"("serviceId");

-- AddForeignKey
ALTER TABLE "public"."service" ADD CONSTRAINT "service_coverId_fkey" FOREIGN KEY ("coverId") REFERENCES "public"."media_asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."service" ADD CONSTRAINT "service_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."service" ADD CONSTRAINT "service_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "public"."user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."service_tag" ADD CONSTRAINT "service_tag_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "public"."service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."service_tag" ADD CONSTRAINT "service_tag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "public"."tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."service_category" ADD CONSTRAINT "service_category_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "public"."service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."service_category" ADD CONSTRAINT "service_category_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."service_media" ADD CONSTRAINT "service_media_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "public"."service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."service_media" ADD CONSTRAINT "service_media_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "public"."media_asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."service_branch" ADD CONSTRAINT "service_branch_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "public"."service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."service_branch" ADD CONSTRAINT "service_branch_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "public"."branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."service_form_file" ADD CONSTRAINT "service_form_file_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "public"."service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."service_form_file" ADD CONSTRAINT "service_form_file_formFileId_fkey" FOREIGN KEY ("formFileId") REFERENCES "public"."form_file"("id") ON DELETE CASCADE ON UPDATE CASCADE;
