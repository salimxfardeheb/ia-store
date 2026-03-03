import { collection, query, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/app/lib/firebase";
import { Product } from "../variables";

export async function getAllProducts(): Promise<Product[]> {
  try {
    const req = query(collection(db, "products"));
    const reqSnapshot = await getDocs(req);

    return reqSnapshot.docs.map((doc) => {
      const data = doc.data();

      const product: Product = {
        id: doc.id,
        name: data.name ?? "",
        category: data.category ?? "",
        price: data.price ?? 0,
        stock: data.stock ?? 0,
        sizes: data.sizes ?? [],
        status: data.status ?? "Brouillon",
        createdAt: data.createdAt ?? "",
        mainImage: data.mainImage,
        extraImages: data.extraImages ?? []
      };

      return product;
    });
  } catch (e) {
    console.error("firestore error", e);
    return [];
  }
}

export async function getProductId(id: string | string[]): Promise<Product | null> {
  const productId = Array.isArray(id) ? id[0] : id;
  const docRef = doc(db, "products", productId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as Product;
}