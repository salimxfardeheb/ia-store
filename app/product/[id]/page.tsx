import type { Metadata } from "next";
import ProductDetailClient from "./ProductDetailClient";
import { prisma } from "@/lib/prisma";
import type { Product } from "@/app/variables";

const STATUS_FR: Record<"ACTIVE" | "DRAFT" | "ARCHIVED", Product["status"]> = {
  ACTIVE: "Actif",
  DRAFT: "Brouillon",
  ARCHIVED: "Archivé",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  const p = await prisma.product.findUnique({
    where: { id, deletedAt: null, status: "ACTIVE" },
    select: { name: true, category: true, price: true, mainImage: true },
  });

  if (!p) return { title: "Produit introuvable" };

  const title       = p.name;
  const description = `${p.name} — ${p.category} · ${p.price.toLocaleString("fr-FR")} DA. Découvrez notre sélection de vêtements et accessoires premium.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type:   "website",
      locale: "fr_FR",
      ...(p.mainImage && {
        images: [{ url: p.mainImage, width: 800, height: 800, alt: p.name }],
      }),
    },
    twitter: {
      card:        "summary_large_image",
      title,
      description,
      ...(p.mainImage && { images: [p.mainImage] }),
    },
  };
}

// Types légers pour les suggestions
export interface SuggestedProduct {
  id: string;
  name: string;
  mainImage: string;
  category: string;
  price: number;
  discountPercent: number | null;
}

export interface LookSuggestion {
  lookId: string;
  lookTitle: string;
  lookImage: string;
  products: SuggestedProduct[];
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [dbProduct, looksWithProduct] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: {
        extraImages: { orderBy: { sortOrder: "asc" } },
        sizes:       true,
        variants:    { include: { sizes: true } },
      },
    }),
    // Looks actifs contenant ce produit
    prisma.lookBook.findMany({
      where: {
        active:   true,
        products: { some: { productId: id } },
      },
      include: {
        products: {
          orderBy: { sortOrder: "asc" },
          include: {
            product: {
              select: {
                id: true, name: true, mainImage: true,
                category: true, price: true, discountPercent: true,
                deletedAt: true, status: true,
              },
            },
          },
        },
      },
    }),
  ]);

  let product: Product | null = null;
  if (dbProduct && !dbProduct.deletedAt) {
    product = {
      id:              dbProduct.id,
      name:            dbProduct.name,
      category:        dbProduct.category,
      price:           dbProduct.price,
      discountPercent: dbProduct.discountPercent ?? null,
      stock:           dbProduct.stock,
      status:          STATUS_FR[dbProduct.status],
      mainImage:       dbProduct.mainImage,
      createdAt:       dbProduct.createdAt.toISOString(),
      sizes:       dbProduct.sizes.map((s) => ({ size: s.size, quantity: s.quantity })),
      extraImages: dbProduct.extraImages.map((img) => ({
        url:   img.url,
        ...(img.color ? { color: img.color } : {}),
      })),
      variants: dbProduct.variants.map((v) => ({
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

  // ── Construire les suggestions depuis les looks ──────────────────────────
  let lookSuggestions: LookSuggestion[] = looksWithProduct.map((look) => ({
    lookId:    look.id,
    lookTitle: look.title,
    lookImage: look.imageUrl,
    products:  look.products
      .filter((lp) =>
        lp.productId !== id &&
        lp.product.status === "ACTIVE" &&
        !lp.product.deletedAt
      )
      .map((lp) => ({
        id:              lp.product.id,
        name:            lp.product.name,
        mainImage:       lp.product.mainImage,
        category:        lp.product.category,
        price:           lp.product.price,
        discountPercent: lp.product.discountPercent,
      })),
  })).filter((l) => l.products.length > 0);

  // Fallback : même catégorie si aucun look ne contient ce produit
  let fallbackProducts: SuggestedProduct[] = [];
  if (lookSuggestions.length === 0) {
    const sameCat = await prisma.product.findMany({
      where: {
        category: product.category,
        status:   "ACTIVE",
        deletedAt: null,
        NOT: { id },
      },
      select: {
        id: true, name: true, mainImage: true,
        category: true, price: true, discountPercent: true,
      },
      take: 4,
      orderBy: { createdAt: "desc" },
    });
    fallbackProducts = sameCat.map((p) => ({
      id:              p.id,
      name:            p.name,
      mainImage:       p.mainImage,
      category:        p.category,
      price:           p.price,
      discountPercent: p.discountPercent,
    }));
  }

  return (
    <ProductDetailClient
      product={product}
      lookSuggestions={lookSuggestions}
      fallbackProducts={fallbackProducts}
    />
  );
}