import { Profile } from "@/app/variables";

function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export async function getProfile(token: string): Promise<Profile | null> {
  const res = await fetch("/api/profile", {
    headers: authHeader(token),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return {
    uid: data.id,
    email: data.email,
    name: data.name,
    phone: data.phone ?? "",
    city: data.city ?? "",
    address: data.address ?? "",
    postalCode: data.postalCode ?? "",
  };
}

export async function changePassword(
  token: string,
  currentPassword: string,
  newPassword: string
): Promise<{ success: true } | { error: string }> {
  const res = await fetch("/api/change-password", {
    method:  "POST",
    headers: { "Content-Type": "application/json", ...authHeader(token) },
    body:    JSON.stringify({ currentPassword, newPassword }),
  });
  const data = await res.json();
  if (!res.ok) return { error: data.message ?? data.error ?? "Erreur inconnue" };
  return { success: true };
}

export async function saveProfile(
  token: string,
  data: Partial<Pick<Profile, "phone" | "city" | "address" | "postalCode">>
): Promise<void> {
  await fetch("/api/profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeader(token) },
    body: JSON.stringify(data),
  });
}
