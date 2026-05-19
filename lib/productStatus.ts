import type { Product, ProductImage } from "@/app/variables";

/** Subset of the Prisma Product row needed for mapping */
export type ProductRow = {
  id:              string;
  name:            string;
  category:        string;
  price:           number;
  discountPercent: number | null;
  isBestSeller:    boolean;
  stock:           number;
  status:          string;
  mainImage:       string;
  createdAt:       Date;
  extraImages: { url: string; color: string | null; sortOrder: number }[];
  sizes:       { size: string; quantity: number }[];
  variants:    {
    id:    string;
    color: string;
    sku:   string | null;
    sizes: { id: number; name: string; stock: number; price: number | null }[];
  }[];
};

/** French display label → Prisma enum value */
export function toPrismaStatus(s: string): "ACTIVE" | "ARCHIVED" | "DRAFT" {
  if (s === "Actif")   return "ACTIVE";
  if (s === "Archivé") return "ARCHIVED";
  return "DRAFT";
}

/** Prisma enum value → French display label */
export function fromPrismaStatus(s: string): Product["status"] {
  if (s === "ACTIVE")   return "Actif";
  if (s === "ARCHIVED") return "Archivé";
  return "Brouillon";
}

/** Map a raw Prisma product row to the shared Product interface */
export function toProduct(p: ProductRow): Product {
  const extraImages: ProductImage[] = p.extraImages
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((img) => ({
      url:   img.url,
      ...(img.color ? { color: img.color } : {}),
    }));

  return {
    id:              p.id,
    name:            p.name,
    category:        p.category,
    price:           p.price,
    discountPercent: p.discountPercent ?? null,
    isBestSeller:    p.isBestSeller,
    stock:           p.stock,
    status:          fromPrismaStatus(p.status),
    mainImage:       p.mainImage,
    extraImages,
    createdAt:       p.createdAt.toLocaleDateString("fr-FR", {
      day: "numeric", month: "short", year: "numeric",
    }),
    sizes: p.sizes,
    variants: p.variants.map((v) => ({
      id:    v.id,
      color: v.color,
      sku:   v.sku ?? undefined,
      sizes: v.sizes.map((s) => ({
        name:  s.name,
        stock: s.stock,
        price: s.price ?? undefined,
      })),
    })),
  };
}
