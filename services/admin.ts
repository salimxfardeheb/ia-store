import { Product, Order, OrderStatus, PosCartItem, UnifiedCustomer } from "@/app/variables";

// ─── Auth-aware fetch ─────────────────────────────────────────────────────────
// Reads the JWT from localStorage and attaches it to every request automatically.
// Call this instead of raw `fetch` for any admin endpoint.

const TOKEN_KEY = "ia_token";

function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;

  return fetch(url, {
    ...options,
    headers: {
      ...(options.headers ?? {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export interface DashboardKPI {
  value:    string;
  trend:    string;
  isUp:     boolean;
  subtitle: string;
}

export interface DashboardData {
  kpis: {
    revenue:   DashboardKPI;
    orders:    DashboardKPI;
    avgBasket: DashboardKPI;
  };
  revenueChart: { name: string; revenue: number }[];
  categoryData: { name: string; value: number }[];
  recentOrders: {
    id: string; customer: string; status: string;
    statusStyle: string; amount: string; date: string;
  }[];
  lowStock: { name: string; size: string; stock: number; threshold: number }[];
}

export async function getDashboard(): Promise<DashboardData | null> {
  const res = await authFetch("/api/admin/dashboard");
  if (!res.ok) return null;
  return res.json();
}

// ─── Products ─────────────────────────────────────────────────────────────────

export async function getAllProducts(): Promise<Product[]> {
  const res = await authFetch("/api/admin/products");
  if (!res.ok) return [];
  return res.json();
}

export async function getCategories(): Promise<string[]> {
  const res = await fetch("/api/products/categories");
  if (!res.ok) return [];
  return res.json();
}

export async function addProduct(product: Product): Promise<Product> {
  const res = await authFetch("/api/admin/products", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(product),
  });
  if (!res.ok) {
    const { message, error } = await res.json().catch(() => ({ error: "Erreur création produit" }));
    throw new Error(message ?? error ?? "Erreur création produit");
  }
  return res.json();
}

export async function updateProduct(product: Product, id: string): Promise<Product> {
  const res = await authFetch(`/api/admin/products/${id}`, {
    method:  "PUT",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(product),
  });
  if (!res.ok) {
    const { message, error } = await res.json().catch(() => ({ error: "Erreur mise à jour produit" }));
    throw new Error(message ?? error ?? "Erreur mise à jour produit");
  }
  return res.json();
}

export async function deleteProduct(id: string): Promise<void> {
  await authFetch(`/api/admin/products/${id}`, { method: "DELETE" });
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export async function getOrders(): Promise<Order[]> {
  const res = await authFetch("/api/admin/orders");
  if (!res.ok) return [];
  return res.json();
}

export async function updateOrder(id: string, status: OrderStatus): Promise<void> {
  const res = await authFetch(`/api/admin/orders/${id}`, {
    method:  "PATCH",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ status }),
  });

  if (!res.ok) {
    const { message, error } = await res.json().catch(() => ({ error: "Erreur inconnue" }));
    throw new Error(message ?? error ?? "Erreur inconnue");
  }
}

// ─── Customers (unified: online Users + offline order contacts) ───────────────

export async function getCustomers(token: string, q = ""): Promise<UnifiedCustomer[]> {
  const url = q
    ? `/api/admin/customers?q=${encodeURIComponent(q)}`
    : "/api/admin/customers";
  const res = await authFetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return [];
  return res.json();
}

// ─── POS ──────────────────────────────────────────────────────────────────────

export interface PosPayload {
  customer: {
    name:     string;
    phone:    string;
    email?:   string;
    address?: string;
  };
  items:         PosCartItem[];
  paymentMethod: "cash" | "card";
  total:         number;
}

export async function createOfflineSale(
  token: string,
  payload: PosPayload
): Promise<{ id: string }> {
  const res = await authFetch("/api/admin/pos", {
    method:  "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization:  `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const { message, error } = await res.json().catch(() => ({ error: "Erreur inconnue" }));
    throw new Error(message ?? error ?? "Erreur inconnue");
  }
  return res.json();
}

// ─── Refus livraison ──────────────────────────────────────────────────────────

export async function reportRefusal(
  orderId: string,
  reason: string
): Promise<{ ok: boolean; fraudScore: number | null }> {
  const res = await authFetch(`/api/admin/orders/${orderId}/report-refusal`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ reason }),
  });
  if (!res.ok) {
    const { message, error } = await res.json().catch(() => ({ error: "Échec du signalement" }));
    throw new Error(message ?? error ?? "Échec du signalement");
  }
  return res.json();
}

// ─── Upload ───────────────────────────────────────────────────────────────────

export async function uploadImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await authFetch("/api/admin/upload", { method: "POST", body: formData });
  if (!res.ok) {
    const { message, error } = await res.json().catch(() => ({ error: "Erreur upload image" }));
    throw new Error(message ?? error ?? "Erreur upload image");
  }
  const { url } = await res.json();
  return url;
}
