-- CreateTable
CREATE TABLE "public"."hero_slide" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "callToActionText" TEXT,
    "callToActionUrl" TEXT,
    "status" "public"."PublishStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "order" INTEGER NOT NULL DEFAULT 0,
    "imageId" TEXT,
    "authorId" TEXT NOT NULL,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hero_slide_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "hero_slide_status_publishedAt_idx" ON "public"."hero_slide"("status", "publishedAt");

-- CreateIndex
CREATE INDEX "hero_slide_order_idx" ON "public"."hero_slide"("order");

-- AddForeignKey
ALTER TABLE "public"."hero_slide" ADD CONSTRAINT "hero_slide_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "public"."media_asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."hero_slide" ADD CONSTRAINT "hero_slide_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."hero_slide" ADD CONSTRAINT "hero_slide_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "public"."user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
