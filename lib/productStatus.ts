import type { Product } from "@/app/variables";

/** Subset of the Prisma Product row needed for mapping */
export type ProductRow = {
  id:          string;
  name:        string;
  category:    string;
  price:       number;
  stock:       number;
  status:      string;
  mainImage:   string;
  extraImages: string;
  createdAt:   Date;
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
  let extraImages: string[] = [];
  try { extraImages = JSON.parse(p.extraImages || "[]"); } catch { /* ignore */ }

  return {
    id:          p.id,
    name:        p.name,
    category:    p.category,
    price:       p.price,
    stock:       p.stock,
    status:      fromPrismaStatus(p.status),
    mainImage:   p.mainImage,
    extraImages,
    createdAt:   p.createdAt.toLocaleDateString("fr-FR", {
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
