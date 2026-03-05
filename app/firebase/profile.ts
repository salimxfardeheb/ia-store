import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "@/app/lib/firebase";

export interface Profile {
  uid: string;
  phone: string;
  city: string;
  address: string;
  postalCode: string;
}

export async function getProfile(uid: string): Promise<Profile | null> {
  const snap = await getDoc(doc(db, "profile", uid));
  if (!snap.exists()) return null;
  return snap.data() as Profile;
}

export async function saveProfile(uid: string, data: Omit<Profile, "uid">): Promise<void> {
  await setDoc(doc(db, "profile", uid), { uid, ...data }, { merge: true });
}