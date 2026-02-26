"use client";

import "./globals.css";

import Navbar from "@/app/components/NavBar";
import Footer from "@/app/components/Footer";
import { CartProvider } from "@/app/context/CartContext";
import { AuthProvider } from "./context/AuthContext";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>

        <CartProvider>
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="grow">{children}</main>
            <Footer />
          </div>
        </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}