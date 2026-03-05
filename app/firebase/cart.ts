import { doc, setDoc, getDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/app/lib/firebase";
import { CartItem } from "../variables";


export async function saveCart(uid: string, cart: CartItem[]): Promise<void> {
  await setDoc(doc(db, "carts", uid), { items: cart, updatedAt: new Date().toISOString() });
}

export async function loadCart(uid: string): Promise<CartItem[]> {
  const snap = await getDoc(doc(db, "carts", uid));
  if (!snap.exists()) return [];
  return snap.data().items as CartItem[];
}

export async function clearCartFirestore(uid: string): Promise<void> {
  await deleteDoc(doc(db, "carts", uid));
}