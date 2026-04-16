import "@/app/globals.css";

import LayoutShell from "@/app/components/LayoutShell";
import { CartProvider } from "@/app/context/CartContext";
import { AuthProvider } from "@/app/context/AuthContext";

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
          <CartProvider>
            <LayoutShell>{children}</LayoutShell>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}