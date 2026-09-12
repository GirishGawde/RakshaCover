"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // 1. If we are already on the login page, allow rendering.
    if (pathname === "/login") {
      setIsAuthorized(true);
      return;
    }

    // 2. Check for our mock user in sessionStorage instead of localStorage so it resets when closing the tab.
    const user = sessionStorage.getItem("raksha_user");
    if (!user) {
      // 3. If missing, boot them to the login screen.
      router.push("/login");
    } else {
      // 4. Otherwise, allow access.
      setIsAuthorized(true);
    }
  }, [pathname, router]);

  // Prevent flash of content before the redirect happens
  if (!isAuthorized) {
    return <div className="min-h-screen bg-[#0d0d0d]" />;
  }

  return <>{children}</>;
}
