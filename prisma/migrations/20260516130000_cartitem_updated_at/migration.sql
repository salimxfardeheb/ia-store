-- Add updatedAt to CartItem for abandoned-cart detection

ALTER TABLE "CartItem"
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW();

CREATE INDEX "CartItem_updatedAt_idx" ON "CartItem"("updatedAt");
