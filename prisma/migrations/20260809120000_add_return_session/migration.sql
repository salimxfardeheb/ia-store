-- CreateTable
CREATE TABLE "ReturnSession" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReturnSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ReturnSession_token_key" ON "ReturnSession"("token");

-- CreateIndex
CREATE INDEX "ReturnSession_orderId_idx" ON "ReturnSession"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "ReturnSession_orderId_productName_key" ON "ReturnSession"("orderId", "productName");

-- AddForeignKey
ALTER TABLE "ReturnSession" ADD CONSTRAINT "ReturnSession_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
