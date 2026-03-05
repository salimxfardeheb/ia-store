import { collection, addDoc, serverTimestamp, doc } from "firebase/firestore";
import { db } from "@/app/lib/firebase";
import { Order } from "../variables";

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
