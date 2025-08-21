/*
  Warnings:

  - A unique constraint covering the columns `[fileKey]` on the table `media_asset` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."user" ALTER COLUMN "emailVerified" SET DEFAULT false;

-- CreateTable
CREATE TABLE "public"."article_media" (
    "articleId" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "article_media_pkey" PRIMARY KEY ("articleId","mediaId")
);

-- CreateIndex
CREATE INDEX "article_media_articleId_order_idx" ON "public"."article_media"("articleId", "order");

-- CreateIndex
CREATE INDEX "article_createdAt_idx" ON "public"."article"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "media_asset_fileKey_key" ON "public"."media_asset"("fileKey");

-- AddForeignKey
ALTER TABLE "public"."article_media" ADD CONSTRAINT "article_media_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "public"."article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."article_media" ADD CONSTRAINT "article_media_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "public"."media_asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
