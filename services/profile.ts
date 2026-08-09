import { Profile } from "@/app/variables";

// Auth est porté par le cookie HttpOnly — on a juste besoin de credentials:'include'.

export async function getProfile(): Promise<Profile | null> {
  const res = await fetch("/api/profile", { credentials: "include" });
  if (!res.ok) return null;
  const data = await res.json();
  return {
    uid:        data.id,
    email:      data.email,
    name:       data.name,
    phone:      data.phone      ?? "",
    city:       data.city       ?? "",
    address:    data.address    ?? "",
    postalCode: data.postalCode ?? "",
    // L'API renvoie un ISO complet ; l'`<input type="date">` veut YYYY-MM-DD.
    birthDate:  data.birthDate ? String(data.birthDate).slice(0, 10) : null,
    gender:     data.gender     ?? null,
  };
}

export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<{ success: true } | { error: string }> {
  const res = await fetch("/api/change-password", {
    method:      "POST",
    credentials: "include",
    headers:     { "Content-Type": "application/json" },
    body:        JSON.stringify({ currentPassword, newPassword }),
  });
  const data = await res.json();
  if (!res.ok) return { error: data.message ?? data.error ?? "Erreur inconnue" };
  return { success: true };
}

export async function saveProfile(
  data: Partial<Pick<Profile, "phone" | "city" | "address" | "postalCode" | "birthDate" | "gender">>
): Promise<void> {
  await fetch("/api/profile", {
    method:      "PATCH",
    credentials: "include",
    headers:     { "Content-Type": "application/json" },
    body:        JSON.stringify(data),
  });
}
