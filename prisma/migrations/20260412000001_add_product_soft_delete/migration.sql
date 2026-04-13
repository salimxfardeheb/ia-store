-- Add soft-delete column to Product
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

-- Prevent negative stock at the database level (defense in depth)
ALTER TABLE "Product"     DROP CONSTRAINT IF EXISTS "product_stock_non_negative";
ALTER TABLE "Product"     ADD CONSTRAINT  "product_stock_non_negative"   CHECK (stock >= 0);

ALTER TABLE "ProductSize" DROP CONSTRAINT IF EXISTS "productsize_qty_non_negative";
ALTER TABLE "ProductSize" ADD CONSTRAINT  "productsize_qty_non_negative" CHECK (quantity >= 0);
