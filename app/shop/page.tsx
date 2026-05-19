import { Suspense } from "react";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import type { Product } from "@/app/variables";
import ShopClient from "./ShopClient";

export const revalidate = 60; // ISR : regénère au plus toutes les 60s

export const metadata: Metadata = {
  title: "Collections",
  description: "Découvrez notre sélection de vêtements et accessoires premium.",
};

const LIMIT = 12;

type SortOption = "newest" | "price-asc" | "price-desc";

function toOrderBy(sort: SortOption) {
  if (sort === "price-asc")  return { price: "asc"  as const };
  if (sort === "price-desc") return { price: "desc" as const };
  return { createdAt: "desc" as const };
}

function shapeProduct(p: {
  id: string; name: string; category: string; price: number; discountPercent: number | null; stock: number;
  mainImage: string; createdAt: Date;
  extraImages: { url: string; color: string | null; sortOrder: number }[];
  sizes: { size: string; quantity: number }[];
  variants: { id: string; color: string; sku: string | null; sizes: { name: string; stock: number; price: number | null }[] }[];
}): Product {
  return {
    id:              p.id,
    name:            p.name,
    category:        p.category,
    price:           p.price,
    discountPercent: p.discountPercent ?? null,
    stock:           p.stock,
    mainImage:       p.mainImage,
    extraImages: p.extraImages.map((img) => ({
      url:   img.url,
      ...(img.color ? { color: img.color } : {}),
    })),
    status:    "Actif",
    createdAt: p.createdAt.toISOString(),
    sizes:     p.sizes.map((s) => ({ size: s.size, quantity: s.quantity })),
    variants:  p.variants.map((v) => ({
      id:    v.id,
      color: v.color,
      sku:   v.sku ?? undefined,
      sizes: v.sizes.map((s) => ({ name: s.name, stock: s.stock, price: s.price ?? undefined })),
    })),
  };
}

interface PageProps {
  searchParams: Promise<{ category?: string; sort?: string; page?: string; promo?: string }>;
}

export default async function ShopPage({ searchParams }: PageProps) {
  const params   = await searchParams;
  const category = params.category ?? "";
  const sort     = (params.sort as SortOption) ?? "newest";
  const promo    = params.promo === "true";
  const page     = Math.max(1, parseInt(params.page ?? "1", 10));
  const skip     = (page - 1) * LIMIT;

  const where = {
    status:    "ACTIVE" as const,
    deletedAt: null,
    ...(category && category !== "Tous" ? { category } : {}),
    ...(promo ? { discountPercent: { not: null } } : {}),
  };

  const [rawProducts, total, categoryRows] = await Promise.all([
    prisma.product.findMany({
      where,
      include:  { extraImages: { orderBy: { sortOrder: "asc" } }, sizes: true, variants: { include: { sizes: true } } },
      orderBy:  toOrderBy(sort),
      skip,
      take:     LIMIT,
    }),
    prisma.product.count({ where }),
    prisma.product.findMany({
      where:    { status: "ACTIVE", deletedAt: null },
      select:   { category: true },
      distinct: ["category"],
      orderBy:  { category: "asc" },
    }),
  ]);

  const products   = rawProducts.map(shapeProduct);
  const categories = categoryRows.map((r) => r.category);

  return (
    <div className="pt-32 pb-24 px-6 max-w-7xl mx-auto">
      <Suspense fallback={null}>
        <ShopClient
          products={products}
          categories={categories}
          total={total}
          page={page}
          limit={LIMIT}
          activeCategory={category || "Tous"}
          sort={sort}
          promoOnly={promo}
        />
      </Suspense>
    </div>
  );
}
