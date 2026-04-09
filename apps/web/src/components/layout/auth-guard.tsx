"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken, getUser } from "@/lib/api";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const token = getToken();
    const user = getUser();
    if (!token || !user) {
      router.replace("/login");
      return;
    }
    if (user.role !== "admin") {
      router.replace("/login");
      return;
    }
    setChecked(true);
  }, [router]);

  if (!checked) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">Yükleniyor...</p>
      </div>
    );
  }

  return <>{children}</>;
}
