import type { SizeEntry, VariantEntry } from "@/app/variables";

// Minimal shape accepted by these helpers — both the Prisma select results
// and the client-side Product type satisfy it.
interface StockProduct {
  stock: number;
  sizes: SizeEntry[];
  variants?: VariantEntry[] | null;
}

/** True when the product's authoritative stock lives in its variants. */
export function hasVariants(product: StockProduct): boolean {
  return (product.variants?.length ?? 0) > 0;
}

/**
 * Total available stock for a product, optionally scoped to a specific
 * color and/or size.
 *
 * Resolution order:
 *   1. variant + size  → VariantSize.stock
 *   2. variant only    → sum of all VariantSize.stock for that color
 *   3. size only       → ProductSize.quantity
 *   4. simple product  → Product.stock
 */
export function getEffectiveStock(
  product: StockProduct,
  selectedColor?: string | null,
  selectedSize?: string | null
): number {
  if (selectedColor) {
    const variant = product.variants?.find((v) => v.color === selectedColor);
    if (!variant) return 0;
    if (selectedSize) {
      return variant.sizes.find((s) => s.name === selectedSize)?.stock ?? 0;
    }
    return variant.sizes.reduce((sum, s) => sum + s.stock, 0);
  }

  if (selectedSize) {
    return product.sizes.find((s) => s.size === selectedSize)?.quantity ?? 0;
  }

  if (hasVariants(product)) {
    return (product.variants ?? []).reduce(
      (sum, v) => sum + v.sizes.reduce((s, vs) => s + vs.stock, 0),
      0
    );
  }

  return product.stock;
}
