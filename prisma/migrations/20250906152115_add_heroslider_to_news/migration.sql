-- AlterTable
ALTER TABLE "public"."hero_slide" ADD COLUMN     "sourceNewsId" TEXT;

-- AddForeignKey
ALTER TABLE "public"."hero_slide" ADD CONSTRAINT "hero_slide_sourceNewsId_fkey" FOREIGN KEY ("sourceNewsId") REFERENCES "public"."news"("id") ON DELETE SET NULL ON UPDATE CASCADE;
