-- Add color snapshot to OrderItem (variant color sold/ordered)
ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "color" TEXT;

-- Add color to CartItem. The size column may or may not already exist depending
-- on the DB's history (it was added to the Prisma schema without an explicit
-- migration), so we add both columns idempotently.
ALTER TABLE "CartItem" ADD COLUMN IF NOT EXISTS "size"  TEXT;
ALTER TABLE "CartItem" ADD COLUMN IF NOT EXISTS "color" TEXT;

-- Replace whatever unique index currently scopes a cart line with the new one
-- that includes (size, color) so the same product in two different colors are
-- distinct cart lines. Use IF EXISTS to tolerate either historical name.
DROP INDEX IF EXISTS "CartItem_userId_productId_key";
DROP INDEX IF EXISTS "CartItem_userId_productId_size_key";

CREATE UNIQUE INDEX IF NOT EXISTS "CartItem_userId_productId_size_color_key"
    ON "CartItem"("userId", "productId", "size", "color");
