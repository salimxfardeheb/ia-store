
export interface SizeEntry {
  size: string;
  quantity: number;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  sizes: SizeEntry[];
  status: "Actif" | "Brouillon" | "Archivé";
  createdAt: string;
  mainImage: string;
  extraImages?: string[];
}

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  createdAt?: string;
}