-- Aligne la DB avec le schéma Prisma : ajoute SELLER/RETURNED, OrderChannel,
-- les tables Variant/VariantSize, la colonne Order.channel, OrderItem.size,
-- et les index attendus. Tout est idempotent pour pouvoir être rejoué.

-- ─── Enums : nouvelles valeurs ─────────────────────────────────────────────
ALTER TYPE "UserRole"    ADD VALUE IF NOT EXISTS 'SELLER';
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'RETURNED';

-- ─── Enum OrderChannel ─────────────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'OrderChannel') THEN
    CREATE TYPE "OrderChannel" AS ENUM ('ONLINE', 'OFFLINE');
  END IF;
END $$;

-- ─── Order.channel ─────────────────────────────────────────────────────────
ALTER TABLE "Order"
  ADD COLUMN IF NOT EXISTS "channel" "OrderChannel" NOT NULL DEFAULT 'ONLINE';

-- ─── OrderItem.size (snapshot taille au moment de la commande) ─────────────
ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "size" TEXT;

-- ─── Table Variant ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "Variant" (
  "id"        TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "color"     TEXT NOT NULL,
  "sku"       TEXT,

  CONSTRAINT "Variant_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Variant_productId_color_key"
  ON "Variant"("productId", "color");

CREATE INDEX IF NOT EXISTS "Variant_productId_idx"
  ON "Variant"("productId");

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Variant_productId_fkey'
  ) THEN
    ALTER TABLE "Variant"
      ADD CONSTRAINT "Variant_productId_fkey"
      FOREIGN KEY ("productId") REFERENCES "Product"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- ─── Table VariantSize ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "VariantSize" (
  "id"        SERIAL NOT NULL,
  "variantId" TEXT   NOT NULL,
  "name"      TEXT   NOT NULL,
  "stock"     INTEGER NOT NULL DEFAULT 0,
  "price"     DOUBLE PRECISION,

  CONSTRAINT "VariantSize_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "VariantSize_variantId_name_key"
  ON "VariantSize"("variantId", "name");

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'VariantSize_variantId_fkey'
  ) THEN
    ALTER TABLE "VariantSize"
      ADD CONSTRAINT "VariantSize_variantId_fkey"
      FOREIGN KEY ("variantId") REFERENCES "Variant"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- Empêcher les stocks négatifs côté DB
ALTER TABLE "VariantSize" DROP CONSTRAINT IF EXISTS "variantsize_stock_non_negative";
ALTER TABLE "VariantSize" ADD  CONSTRAINT "variantsize_stock_non_negative" CHECK (stock >= 0);

-- ─── Index manquants ───────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS "Order_userId_idx"          ON "Order"("userId");
CREATE INDEX IF NOT EXISTS "Order_channel_userId_idx"  ON "Order"("channel", "userId");
CREATE INDEX IF NOT EXISTS "Product_status_deletedAt_idx" ON "Product"("status", "deletedAt");
