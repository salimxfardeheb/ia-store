-- CreateTable
CREATE TABLE "LookBook" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "tag" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "imageUrl" TEXT NOT NULL,
    "accent" TEXT NOT NULL DEFAULT '#1a1713',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LookBook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LookBookProduct" (
    "id" SERIAL NOT NULL,
    "lookId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "LookBookProduct_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LookBookProduct_lookId_idx" ON "LookBookProduct"("lookId");

-- CreateIndex
CREATE INDEX "LookBookProduct_productId_idx" ON "LookBookProduct"("productId");

-- AddForeignKey
ALTER TABLE "LookBookProduct" ADD CONSTRAINT "LookBookProduct_lookId_fkey" FOREIGN KEY ("lookId") REFERENCES "LookBook"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LookBookProduct" ADD CONSTRAINT "LookBookProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
