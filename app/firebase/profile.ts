import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/app/lib/firebase";
import { Profile } from "@/app/variables";

export async function getProfile(uid: string): Promise<Profile | null> {
  const snap = await getDoc(doc(db, "profile", uid));
  if (!snap.exists()) return null;
  return snap.data() as Profile;
}

export async function saveProfile(
  uid: string,
  data: Omit<Profile, "uid">,
): Promise<void> {
  const userRef = doc(db, "users", uid);
  await setDoc(doc(db, "profile", uid), { userRef, ...data }, { merge: true });
}