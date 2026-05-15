import "@/app/globals.css";

import LayoutShell from "@/app/components/LayoutShell";
import { CartProvider } from "@/app/context/CartContext";
import { AuthProvider } from "@/app/context/AuthContext";
import { FavoritesProvider } from "@/app/context/FavoritesContext";

export const metadata = { title: "I.A Store" };

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
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