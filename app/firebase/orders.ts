import { collection, addDoc, serverTimestamp, doc } from "firebase/firestore";
import { db } from "@/app/lib/firebase";
import { CartItem } from "@/app/firebase/cart";
import { Profile } from "../variables";

export interface OrderForm extends Profile {
  fullName: string;
  paymentMethod: "cash" | "card";
  deliveryType: "home" | "bureau";
}

export interface Order {
  form: OrderForm;
  items: CartItem[];
  total: number;
  status: "pending";
  createdAt: unknown;
}

export async function createOrder(
  uid: string,
  order: Omit<Order, "createdAt" | "status">,
): Promise<string> {
  const userRef = doc(db, "users", uid);
  const docRef = await addDoc(collection(db, "orders"), {
    userRef,
    ...order,
    status: "pending",
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}
