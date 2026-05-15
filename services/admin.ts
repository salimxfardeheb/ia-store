import { Product, Order, OrderStatus, PosCartItem, UnifiedCustomer } from "@/app/variables";

// ─── Auth-aware fetch ─────────────────────────────────────────────────────────
// The session is carried by the HttpOnly cookie set on /api/auth/login.
// All admin requests just need `credentials: 'include'`.

function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  return fetch(url, {
    ...options,
    credentials: "include",
    headers:     { ...(options.headers ?? {}) },
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

export interface CustomersQuery {
  q?:       string;
  channel?: "all" | "online" | "offline";
  page?:    number;
  limit?:   number;
}

export interface CustomersResult {
  items: UnifiedCustomer[];
  total: number;
  page:  number;
  limit: number;
}

export async function getCustomers(query: CustomersQuery = {}): Promise<CustomersResult> {
  const params = new URLSearchParams();
  if (query.q)       params.set("q",       query.q);
  if (query.channel) params.set("channel", query.channel);
  if (query.page)    params.set("page",    String(query.page));
  if (query.limit)   params.set("limit",   String(query.limit));
  const qs  = params.size ? `?${params.toString()}` : "";
  const res = await authFetch(`/api/admin/customers${qs}`);
  if (!res.ok) return { items: [], total: 0, page: 1, limit: 50 };
  const items = (await res.json()) as UnifiedCustomer[];
  const total = parseInt(res.headers.get("X-Total-Count") ?? "0", 10) || items.length;
  const page  = parseInt(res.headers.get("X-Page")        ?? "1", 10) || 1;
  const limit = parseInt(res.headers.get("X-Limit")       ?? "50", 10) || 50;
  return { items, total, page, limit };
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

export async function createOfflineSale(payload: PosPayload): Promise<{ id: string }> {
  const res = await authFetch("/api/admin/pos", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(payload),
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
