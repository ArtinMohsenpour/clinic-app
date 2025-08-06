-- AlterTable
ALTER TABLE "public"."Session" ADD COLUMN     "data" JSONB,
ADD COLUMN     "revoked" BOOLEAN NOT NULL DEFAULT false;
