-- CreateTable: replace extraImages JSON string with a proper ProductImage table

CREATE TABLE "ProductImage" (
    "id"        SERIAL NOT NULL,
    "productId" TEXT NOT NULL,
    "url"       TEXT NOT NULL,
    "color"     TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ProductImage_pkey" PRIMARY KEY ("id")
);

-- Migrate existing JSON data into rows
-- Each element is either { "url": "...", "color": "..." } or a plain string (legacy)
INSERT INTO "ProductImage" ("productId", "url", "color", "sortOrder")
SELECT
    p.id AS "productId",
    elem->>'url'   AS url,
    elem->>'color' AS color,
    (ordinality - 1)::int AS "sortOrder"
FROM "Product" p,
     jsonb_array_elements(
         CASE
             WHEN p."extraImages" IS NULL OR p."extraImages" = '' THEN '[]'::jsonb
             ELSE p."extraImages"::jsonb
         END
     ) WITH ORDINALITY AS t(elem, ordinality)
WHERE
    -- skip legacy plain-string elements that have no "url" key
    elem->>'url' IS NOT NULL
    AND elem->>'url' != '';

-- AddForeignKey
ALTER TABLE "ProductImage" ADD CONSTRAINT "ProductImage_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "ProductImage_productId_idx" ON "ProductImage"("productId");
CREATE INDEX "ProductImage_productId_color_idx" ON "ProductImage"("productId", "color");

-- DropColumn
ALTER TABLE "Product" DROP COLUMN "extraImages";
