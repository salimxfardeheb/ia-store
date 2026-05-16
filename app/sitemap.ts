import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ia-store.dz";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await prisma.product.findMany({
    where:  { status: "ACTIVE", deletedAt: null },
    select: { id: true, createdAt: true },
  });

  const productUrls: MetadataRoute.Sitemap = products.map((p) => ({
    url:          `${BASE_URL}/product/${p.id}`,
    lastModified: p.createdAt,
    changeFrequency: "weekly",
    priority:     0.8,
  }));

  const staticUrls: MetadataRoute.Sitemap = [
    { url: BASE_URL,         lastModified: new Date(), changeFrequency: "daily",  priority: 1.0 },
    { url: `${BASE_URL}/shop`, lastModified: new Date(), changeFrequency: "daily",  priority: 0.9 },
  ];

  return [...staticUrls, ...productUrls];
}
