import type React from "react";
import {
  LayoutDashboard, ShoppingBag, Package, Users, BarChart3,
  Wallet, Calendar, Settings, ShoppingCart, UserRound
} from "lucide-react";

export type AdminRole = "ADMIN" | "SELLER";

export const WILAYAS = [
  "Adrar",
  "Chlef",
  "Laghouat",
  "Oum El Bouaghi",
  "Batna",
  "Béjaïa",
  "Biskra",
  "Béchar",
  "Blida",
  "Bouira",
  "Tamanrasset",
  "Tébessa",
  "Tlemcen",
  "Tiaret",
  "Tizi Ouzou",
  "Alger",
  "Djelfa",
  "Jijel",
  "Sétif",
  "Saïda",
  "Skikda",
  "Sidi Bel Abbès",
  "Annaba",
  "Guelma",
  "Constantine",
  "Médéa",
  "Mostaganem",
  "M'Sila",
  "Mascara",
  "Ouargla",
  "Oran",
  "El Bayadh",
  "Illizi",
  "Bordj Bou Arréridj",
  "Boumerdès",
  "El Tarf",
  "Tindouf",
  "Tissemsilt",
  "El Oued",
  "Khenchela",
  "Souk Ahras",
  "Tipaza",
  "Mila",
  "Aïn Defla",
  "Naâma",
  "Aïn Témouchent",
  "Ghardaïa",
  "Relizane",
];

//  ─── products  ────────────────────────────────────────────────────────────────

export interface SizeEntry {
  size: string;
  quantity: number;
}

// ─── Variantes couleur ───────────────────────────────────────────────────────

export interface VariantSizeEntry {
  name: string;
  stock: number;
  price?: number; // null/undefined = hérite du prix de base du produit
}

export interface VariantEntry {
  id?: string;
  color: string;
  sku?: string;
  sizes: VariantSizeEntry[];
}

export interface ProductImage {
  url: string;
  color?: string; // couleur associée à cette image (ex: "Rouge", "Marine")
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  sizes: SizeEntry[];
  variants?: VariantEntry[];
  status: "Actif" | "Brouillon" | "Archivé";
  createdAt: string;
  mainImage: string;
  extraImages?: ProductImage[];
}

// ─── Unified customer (online Users + offline order contacts) ─────────────────

export interface UnifiedCustomer {
  id:          string;
  name:        string;
  email:       string | null;
  phone:       string | null;
  address:     string | null;
  channel:     "online" | "offline";
  ordersCount: number;
  lastOrderAt: string | null;
  createdAt:   string;
}

export interface PosCartItem {
  productId: string;
  name:      string;
  price:     number;
  quantity:  number;
  size?:     string;
  color?:    string; // couleur variante (uniquement produits à variantes)
  mainImage: string;
  category:  string;
  maxStock:  number; // used for qty cap validation
}

//  ─── Profile  ────────────────────────────────────────────────────────────────

export interface Profile extends UserProfile {
  phone: string;
  city: string;
  address: string;
  postalCode: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  createdAt?: string;
}

//  ********************************************************************************************************************

//  ─── Orders  ────────────────────────────────────────────────────────────────

export interface Order {
  id:        string;
  form:      OrderForm;
  items:     CartItem[];
  total:     number;
  status:    OrderStatus;
  channel?:  "online" | "offline";
  createdAt: Date;
}

export interface OrderForm extends Omit<Profile, "city" | "address" | "postalCode" | "email"> {
  email:         string | null;
  city:          string | null;
  address:       string | null;
  postalCode:    string | null;
  paymentMethod: "cash" | "card";
  deliveryType:  "home" | "bureau" | "store";
}

export interface CartItem extends Product {
  quantity:       number;
  selectedSize?:  string;
  selectedColor?: string;
}


export type OrderStatus = "pending" | "confirmed" | "shipped" | "delivered" | "cancelled" | "returned";

export interface ReclamationForm {
  orderId: string;
  productName: string;
  type: string;
  description: string;
}


export const PIE_COLORS = ["#0A0A0A", "#3A3A3A", "#7A7A7A", "#CACACA"];


export const NAV_ITEMS: { id: string; icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>; label: string; href: string; roles: AdminRole[] }[] = [
  { id: "overview",   icon: LayoutDashboard, label: "Vue d'ensemble",  href: "/admin",            roles: ["ADMIN", "SELLER"]  },
  { id: "catalog",    icon: Package,         label: "Catalogue",       href: "/admin/catalog",    roles: ["ADMIN", "SELLER"]  },
  { id: "orders",     icon: ShoppingBag,     label: "Commandes",       href: "/admin/orders",     roles: ["ADMIN", "SELLER"]  },
  { id: "pos",        icon: ShoppingCart,    label: "Nouvelle vente",  href: "/admin/pos",        roles: ["ADMIN", "SELLER"]  },
  { id: "customers",  icon: Users,           label: "Clients",         href: "/admin/customers",  roles: ["ADMIN", "SELLER"]  },
  { id: "users",      icon: UserRound,       label: "Comptes",         href: "/admin/users",      roles: ["ADMIN"]            },
  { id: "analytics",  icon: BarChart3,       label: "Analytiques",     href: "/admin/analytics",  roles: ["ADMIN"]            },
  { id: "finance",    icon: Wallet,          label: "Finance",         href: "/admin/finance",    roles: ["ADMIN"]            },
];

export const BOTTOM_NAV: { id: string; icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>; label: string; href: string; roles: AdminRole[] }[] = [
  { id: "planning",  icon: Calendar, label: "Planning",    href: "/admin/planning",  roles: ["ADMIN"] },
  { id: "settings",  icon: Settings, label: "Paramètres",  href: "/admin/settings",  roles: ["ADMIN"] },
];

export const SIZE_OPTIONS = ["XS", "S", "M", "L", "XL", "XXL", "Unique"];
export const SHOE_SIZE_OPTIONS = ["36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46"];
export const STATUSES   = ["Tous", "Actif", "Brouillon", "Archivé"];



// ── Config ───────────────────────────────────────────────────────────────────

export const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bg: string }> = {
  pending:   { label: "En attente",  color: "text-amber-600",  bg: "bg-amber-50"   },
  confirmed: { label: "Confirmée",   color: "text-blue-600",   bg: "bg-blue-50"    },
  shipped:   { label: "Expédiée",    color: "text-purple-600", bg: "bg-purple-50"  },
  delivered: { label: "Livrée",      color: "text-emerald-600",bg: "bg-emerald-50" },
  cancelled: { label: "Annulée",     color: "text-red-500",    bg: "bg-red-50"     },
  returned:  { label: "Retournée",   color: "text-orange-600", bg: "bg-orange-50"  },
};

export const STATUS_FLOW: OrderStatus[] = ["pending", "confirmed", "shipped", "delivered", "cancelled", "returned"];

// ── Helpers ──────────────────────────────────────────────────────────────────

export function formatDate(ts: Date | string | null | undefined) {
  if (!ts) return "—";
  const d = ts instanceof Date ? ts : new Date(ts);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("fr-FR", {
    day: "numeric", month: "short", year: "numeric",
  });
}