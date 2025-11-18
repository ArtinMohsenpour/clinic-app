-- CreateEnum
CREATE TYPE "public"."ContactItemType" AS ENUM ('PHONE', 'EMAIL', 'ADDRESS');

-- CreateTable
CREATE TABLE "public"."static_page" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" JSONB,
    "status" "public"."PublishStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "authorId" TEXT NOT NULL,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "static_page_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."contact_item" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "type" "public"."ContactItemType" NOT NULL,
    "label" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "url" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contact_item_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "static_page_slug_key" ON "public"."static_page"("slug");

-- CreateIndex
CREATE INDEX "contact_item_pageId_order_idx" ON "public"."contact_item"("pageId", "order");

-- AddForeignKey
ALTER TABLE "public"."static_page" ADD CONSTRAINT "static_page_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."static_page" ADD CONSTRAINT "static_page_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "public"."user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."contact_item" ADD CONSTRAINT "contact_item_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "public"."static_page"("id") ON DELETE CASCADE ON UPDATE CASCADE;
