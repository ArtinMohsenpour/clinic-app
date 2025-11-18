-- CreateTable
CREATE TABLE "public"."Education" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT,
    "body" JSONB NOT NULL,
    "status" "public"."PublishStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "coverId" TEXT,
    "authorId" TEXT NOT NULL,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Education_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."EducationTag" (
    "educationId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "EducationTag_pkey" PRIMARY KEY ("educationId","tagId")
);

-- CreateTable
CREATE TABLE "public"."EducationCategory" (
    "educationId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "EducationCategory_pkey" PRIMARY KEY ("educationId","categoryId")
);

-- CreateTable
CREATE TABLE "public"."EducationMedia" (
    "educationId" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "EducationMedia_pkey" PRIMARY KEY ("educationId","mediaId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Education_slug_key" ON "public"."Education"("slug");

-- AddForeignKey
ALTER TABLE "public"."Education" ADD CONSTRAINT "Education_coverId_fkey" FOREIGN KEY ("coverId") REFERENCES "public"."media_asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Education" ADD CONSTRAINT "Education_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Education" ADD CONSTRAINT "Education_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "public"."user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EducationTag" ADD CONSTRAINT "EducationTag_educationId_fkey" FOREIGN KEY ("educationId") REFERENCES "public"."Education"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EducationTag" ADD CONSTRAINT "EducationTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "public"."tag"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EducationCategory" ADD CONSTRAINT "EducationCategory_educationId_fkey" FOREIGN KEY ("educationId") REFERENCES "public"."Education"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EducationCategory" ADD CONSTRAINT "EducationCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EducationMedia" ADD CONSTRAINT "EducationMedia_educationId_fkey" FOREIGN KEY ("educationId") REFERENCES "public"."Education"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EducationMedia" ADD CONSTRAINT "EducationMedia_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "public"."media_asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
