import { z } from "zod";
import { NextResponse } from "next/server";

// ─── Structured error helper ──────────────────────────────────────────────────

export function apiError(
  code: string,
  message: string,
  status: number
): NextResponse {
  return NextResponse.json({ code, message }, { status });
}

// ─── Product ──────────────────────────────────────────────────────────────────

export const sizeEntrySchema = z.object({
  size:     z.string().min(1),
  quantity: z.number().int().min(0, "La quantité ne peut pas être négative"),
});

export const productWriteSchema = z.object({
  name:        z.string().min(1, "Nom requis").max(200),
  category:    z.string().min(1, "Catégorie requise").max(100),
  price:       z.number().positive("Le prix doit être positif"),
  stock:       z.number().int().min(0, "Le stock ne peut pas être négatif"),
  status:      z.enum(["Actif", "Archivé", "Brouillon"]),
  mainImage:   z.string().default(""),
  extraImages: z.array(z.string()).default([]),
  sizes:       z.array(sizeEntrySchema).default([]),
});

// ─── Online order ─────────────────────────────────────────────────────────────

export const orderFormSchema = z.object({
  name:          z.string().min(1, "Nom requis").max(200),
  phone:         z.string().min(8, "Téléphone invalide").max(20),
  email:         z.string().email("Email invalide").or(z.literal("")).default(""),
  city:          z.string().min(1, "Ville requise").max(100),
  address:       z.string().min(1, "Adresse requise").max(500),
  postalCode:    z.string().min(1, "Code postal requis").max(20),
  paymentMethod: z.enum(["cash", "card"]),
  deliveryType:  z.enum(["home", "bureau"]),
});

// Only productId + quantity are trusted from the client;
// name, price, mainImage, category are fetched from the database.
export const orderItemSchema = z.object({
  id:           z.string().min(1, "ID produit requis"),
  quantity:     z.number().int().positive("Quantité invalide"),
  selectedSize: z.string().optional(),
});

export const createOrderSchema = z.object({
  form:  orderFormSchema,
  items: z.array(orderItemSchema).min(1, "Le panier est vide"),
});

// ─── POS ──────────────────────────────────────────────────────────────────────

// productId + quantity + size are the only fields trusted from the client.
// name, price, mainImage, category are fetched from the database.
export const posItemSchema = z.object({
  productId: z.string().min(1, "ID produit requis"),
  quantity:  z.number().int().positive("Quantité invalide"),
  size:      z.string().nullable().optional(),
});

export const posBodySchema = z.object({
  customer: z.object({
    name:    z.string().min(1, "Nom client requis").max(200),
    phone:   z.string().min(8, "Téléphone invalide").max(20),
    email:   z.string().email().or(z.literal("")).optional(),
    address: z.string().max(500).optional(),
  }),
  items:         z.array(posItemSchema).min(1, "Le panier est vide"),
  paymentMethod: z.enum(["cash", "card"]),
});

// ─── Cart ─────────────────────────────────────────────────────────────────────

export const cartItemSchema = z.object({
  id:           z.string().min(1, "ID produit requis"),
  quantity:     z.number().int().positive("Quantité invalide"),
  selectedSize: z.string().optional(),
});

export const cartBodySchema = z.array(cartItemSchema).max(100, "Panier trop grand");

// ─── User management (admin) ──────────────────────────────────────────────────

export const userCreateSchema = z.object({
  name:     z.string().min(1, "Nom requis").max(200),
  email:    z.string().email("Email invalide"),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
  role:     z.enum(["ADMIN", "SELLER", "CLIENT"]),
});

export const userRoleSchema = z.object({
  role: z.enum(["ADMIN", "SELLER", "CLIENT"]),
});

// ─── Change password ──────────────────────────────────────────────────────────

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Mot de passe actuel requis"),
    newPassword:     z.string().min(8, "Le nouveau mot de passe doit contenir au moins 8 caractères"),
  })
  .refine((d) => d.currentPassword !== d.newPassword, {
    message: "Le nouveau mot de passe doit être différent de l'ancien",
    path:    ["newPassword"],
  });

// ─── Profile update ───────────────────────────────────────────────────────────

export const profileUpdateSchema = z.object({
  phone:      z.string().min(8, "Téléphone invalide").max(20).optional(),
  city:       z.string().min(1).max(100).optional(),
  address:    z.string().min(1).max(500).optional(),
  postalCode: z.string().min(1).max(20).optional(),
});

// ─── Zod parse helper — returns [data, errorResponse] ────────────────────────

export function safeParse<T>(
  schema: z.ZodType<T>,
  data: unknown
): [T, null] | [null, NextResponse] {
  const result = schema.safeParse(data);
  if (!result.success) {
    const message = result.error.issues[0]?.message ?? "Données invalides";
    return [null, apiError("VALIDATION_ERROR", message, 400)];
  }
  return [result.data, null];
}

// ─── DB / Prisma error handler ────────────────────────────────────────────────
// Prevents raw Prisma errors from leaking to the client.

export function handleDbError(err: unknown): NextResponse {
  if (err && typeof err === "object" && "code" in err) {
    const code = (err as { code: string }).code;
    if (code === "P2002") return apiError("DUPLICATE", "Cette entrée existe déjà", 409);
    if (code === "P2025") return apiError("NOT_FOUND", "Ressource introuvable", 404);
    if (code === "P2003") return apiError("CONSTRAINT_ERROR", "Contrainte de relation violée", 400);
  }
  // Never expose Prisma internals
  console.error("[DB Error]", err);
  return apiError("INTERNAL_ERROR", "Erreur interne du serveur", 500);
}
