-- CreateTable
CREATE TABLE "public"."insurance_company" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "coverageText" TEXT,
    "status" "public"."PublishStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "coverId" TEXT,
    "authorId" TEXT NOT NULL,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "insurance_company_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "insurance_company_slug_key" ON "public"."insurance_company"("slug");

-- CreateIndex
CREATE INDEX "insurance_company_status_publishedAt_idx" ON "public"."insurance_company"("status", "publishedAt");

-- AddForeignKey
ALTER TABLE "public"."insurance_company" ADD CONSTRAINT "insurance_company_coverId_fkey" FOREIGN KEY ("coverId") REFERENCES "public"."media_asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."insurance_company" ADD CONSTRAINT "insurance_company_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."insurance_company" ADD CONSTRAINT "insurance_company_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "public"."user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
