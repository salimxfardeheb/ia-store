import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ia-store.dz";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow:     "/",
        disallow:  ["/admin/", "/api/", "/login", "/signup"],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
