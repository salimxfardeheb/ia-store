-- Convert price columns from FLOAT to INT (DZD has no fractional units)
-- Existing values are rounded to the nearest dinar before the type change.

ALTER TABLE "Product"
  ALTER COLUMN "price" TYPE INTEGER USING ROUND("price")::INTEGER;

ALTER TABLE "VariantSize"
  ALTER COLUMN "price" TYPE INTEGER USING ROUND("price")::INTEGER;

ALTER TABLE "Order"
  ALTER COLUMN "total" TYPE INTEGER USING ROUND("total")::INTEGER;

ALTER TABLE "OrderItem"
  ALTER COLUMN "price" TYPE INTEGER USING ROUND("price")::INTEGER;
