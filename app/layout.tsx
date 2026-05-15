import "@/app/globals.css";

import LayoutShell from "@/app/components/LayoutShell";
import { CartProvider } from "@/app/context/CartContext";
import { AuthProvider } from "@/app/context/AuthContext";
import { FavoritesProvider } from "@/app/context/FavoritesContext";
import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("http://localhost:3000"),

  title: {
    default: "I.A Store",
    template: "%s | I.A Store",
  },

  description:
    "Boutique de vêtements et accessoires premium.",

  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "http://localhost:3000",
    siteName: "I.A Store",

    title: "I.A Store",

    description:
      "Boutique de vêtements et accessoires premium.",

    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "I.A Store",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",

    title: "I.A Store",

    description:
      "Boutique de vêtements et accessoires premium.",

    images: ["/og-image.jpg"],
  },

  robots: {
    index: true,
    follow: true,
  },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body suppressHydrationWarning>
        <AuthProvider>
          <FavoritesProvider>
            <CartProvider>
              <LayoutShell>{children}</LayoutShell>
            </CartProvider>
          </FavoritesProvider>
        </AuthProvider>
      </body>
    </html>
  );
}