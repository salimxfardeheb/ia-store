"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";

/**
 * Wraps all admin pages. Redirects to "/" when:
 *  - auth has finished loading AND the user is not logged in
 *  - the user is logged in but has the CLIENT role
 * Renders nothing (blank screen) while auth is still resolving
 * so the protected content is never flashed to the browser.
 */
export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!user || user.role === "CLIENT") {
      router.replace("/");
    }
  }, [user, isLoading, router]);

  // Don't render anything until we know who the user is
  if (isLoading) return null;

  // User is not authorised — redirect is in progress, render nothing
  if (!user || user.role === "CLIENT") return null;

  return <>{children}</>;
}
