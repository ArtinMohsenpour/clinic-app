-- CreateEnum
CREATE TYPE "public"."FormFileKind" AS ENUM ('ADMISSION', 'CONSENT', 'PRE_VISIT', 'INSURANCE', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."FormAssetRole" AS ENUM ('ATTACHMENT', 'IMAGE');

-- CreateTable
CREATE TABLE "public"."form_file" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "kind" "public"."FormFileKind",
    "language" TEXT,
    "status" "public"."PublishStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "primaryFileId" TEXT,
    "previewImageId" TEXT,
    "authorId" TEXT NOT NULL,
    "updatedById" TEXT,
    "downloads" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "form_file_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."form_file_asset" (
    "formFileId" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "role" "public"."FormAssetRole" NOT NULL DEFAULT 'ATTACHMENT',

    CONSTRAINT "form_file_asset_pkey" PRIMARY KEY ("formFileId","mediaId")
);

-- CreateTable
CREATE TABLE "public"."form_file_tag" (
    "formFileId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "form_file_tag_pkey" PRIMARY KEY ("formFileId","tagId")
);

-- CreateTable
CREATE TABLE "public"."form_file_category" (
    "formFileId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "form_file_category_pkey" PRIMARY KEY ("formFileId","categoryId")
);

-- CreateIndex
CREATE UNIQUE INDEX "form_file_slug_key" ON "public"."form_file"("slug");

-- CreateIndex
CREATE INDEX "form_file_status_publishedAt_idx" ON "public"."form_file"("status", "publishedAt");

-- CreateIndex
CREATE INDEX "form_file_asset_formFileId_order_idx" ON "public"."form_file_asset"("formFileId", "order");

-- AddForeignKey
ALTER TABLE "public"."form_file" ADD CONSTRAINT "form_file_primaryFileId_fkey" FOREIGN KEY ("primaryFileId") REFERENCES "public"."media_asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."form_file" ADD CONSTRAINT "form_file_previewImageId_fkey" FOREIGN KEY ("previewImageId") REFERENCES "public"."media_asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."form_file" ADD CONSTRAINT "form_file_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."form_file" ADD CONSTRAINT "form_file_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "public"."user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."form_file_asset" ADD CONSTRAINT "form_file_asset_formFileId_fkey" FOREIGN KEY ("formFileId") REFERENCES "public"."form_file"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."form_file_asset" ADD CONSTRAINT "form_file_asset_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "public"."media_asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."form_file_tag" ADD CONSTRAINT "form_file_tag_formFileId_fkey" FOREIGN KEY ("formFileId") REFERENCES "public"."form_file"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."form_file_tag" ADD CONSTRAINT "form_file_tag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "public"."tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."form_file_category" ADD CONSTRAINT "form_file_category_formFileId_fkey" FOREIGN KEY ("formFileId") REFERENCES "public"."form_file"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."form_file_category" ADD CONSTRAINT "form_file_category_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
