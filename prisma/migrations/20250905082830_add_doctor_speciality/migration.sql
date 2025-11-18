-- AlterTable
ALTER TABLE "public"."user" ADD COLUMN     "specialtyId" TEXT;

-- CreateTable
CREATE TABLE "public"."specialty" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "specialty_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "specialty_key_key" ON "public"."specialty"("key");

-- CreateIndex
CREATE UNIQUE INDEX "specialty_name_key" ON "public"."specialty"("name");

-- AddForeignKey
ALTER TABLE "public"."user" ADD CONSTRAINT "user_specialtyId_fkey" FOREIGN KEY ("specialtyId") REFERENCES "public"."specialty"("id") ON DELETE SET NULL ON UPDATE CASCADE;
