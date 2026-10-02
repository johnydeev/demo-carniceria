"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "@/demo/sesion";

/**
 * En la app real el proxy no deja entrar al panel sin rol admin. La demo no
 * tiene servidor: el guard hace las dos cosas que hacia el proxy —sin sesion,
 * al login; con rol cliente, al inicio— y no muestra el panel hasta saberlo.
 * Una cuenta bloqueada cuenta como sin sesion, como en el proxy.
 */
export default function AdminSessionGuard({ children }: { children: React.ReactNode }) {
  const { status, data } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  const bloqueado = Boolean(data?.user.bloqueado);
  const sinSesion = status === "unauthenticated" || (status === "authenticated" && bloqueado);
  const esAdmin = status === "authenticated" && !bloqueado && data?.user.role === "admin";

  useEffect(() => {
    if (sinSesion) {
      const next = pathname || "/admin";
      router.replace(`/auth/login?callbackUrl=${encodeURIComponent(next)}`);
    } else if (status === "authenticated" && !esAdmin) {
      router.replace("/");
    }
  }, [sinSesion, esAdmin, status, router, pathname]);

  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        window.location.reload();
      }
    };

    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  if (!esAdmin) return null;
  return <>{children}</>;
}
