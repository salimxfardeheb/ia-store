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
  id: string;
  form: OrderForm;
  items: CartItem[];
  total: number;
  status: OrderStatus;
  createdAt: unknown;
}

export interface OrderForm extends Profile {
  paymentMethod: "cash" | "card";
  deliveryType: "home" | "bureau";
}

export interface CartItem extends Product {
  quantity: number;
}


export type OrderStatus = "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";

