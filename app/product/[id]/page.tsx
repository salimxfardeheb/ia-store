import ProductDetailClient from "./ProductDetailClient";
import { prisma } from "@/lib/prisma";
import type { Product, ProductImage } from "@/app/variables";

const STATUS_FR: Record<"ACTIVE" | "DRAFT" | "ARCHIVED", Product["status"]> = {
  ACTIVE: "Actif",
  DRAFT: "Brouillon",
  ARCHIVED: "Archivé",
};

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const dbProduct = await prisma.product.findUnique({
    where: { id },
    include: {
      sizes: true,
      variants: { include: { sizes: true } },
    },
  });

  let product = null;
  if (dbProduct && !dbProduct.deletedAt) {
    let extraImages: ProductImage[] = [];
    try {
      const parsed = JSON.parse(dbProduct.extraImages || "[]");
      extraImages = Array.isArray(parsed) ? (parsed as ProductImage[]) : [];
    } catch {
      extraImages = [];
    }

    product = {
      ...dbProduct,
      status: STATUS_FR[dbProduct.status],
      createdAt: dbProduct.createdAt.toISOString(),
      extraImages,
      variants: dbProduct.variants.map((v) => ({
        id: v.id,
        color: v.color,
        sku: v.sku ?? undefined,
        sizes: v.sizes.map((s) => ({
          name: s.name,
          stock: s.stock,
          price: s.price ?? undefined,
        })),
      })),
    } satisfies Product;
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center gap-8">
        <div className="w-16 h-px bg-black/15" />
        <h1 className="font-serif text-4xl italic text-black/50">Produit introuvable</h1>
        <div className="w-16 h-px bg-black/15" />
        <a
          href="/shop"
          className="text-[10px] uppercase tracking-[0.35em] font-medium text-black/50 border-b border-black/20 pb-0.5 hover:text-black hover:border-black transition-colors"
        >
          Retour à la boutique
        </a>
      </div>
    );
  }

  return <ProductDetailClient product={product} />;
}