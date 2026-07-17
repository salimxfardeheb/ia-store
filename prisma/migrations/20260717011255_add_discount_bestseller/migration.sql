-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "discountPercent" INTEGER,
ADD COLUMN     "isBestSeller" BOOLEAN NOT NULL DEFAULT false;
