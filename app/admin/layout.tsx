import { redirect } from "next/navigation";
import AdminSidebar from "./components/AdminSidebar";
import { getServerSession } from "@/lib/getServerSession";

export const metadata = { title: "Admin — I.A Store" };

// Server-side gate: read the cookie, verify JWT + Redis blocklist + DB role.
// The client-side AdminGuard still runs for instant UX feedback, but the
// real access control now happens here — before any HTML is sent.
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();

  if (!session || session.role === "CLIENT") {
    redirect("/");
  }

  return (
    <div className="min-h-screen flex bg-[#F7F7F7]">
      <AdminSidebar />
      <main className="flex-1 ml-56 p-8 min-h-screen">{children}</main>
    </div>
  );
}
