'use client';

/**
 * Reemplazo de `next-auth/react` en la demo: `SessionProvider`, `useSession` y
 * `signOut` con la misma forma, mas `entrarComo` para el login de la demo y
 * `useRolDemo` para la barra. Los componentes copiados solo cambian el import.
 *
 * Cambiar de rol recarga la pagina: `CartProvider` no vuelve a cargar si el
 * `status` no cambia, y de Cliente a Dueño seguiria mostrando el carrito del
 * cliente.
 */
import { createContext, useContext, useMemo, useSyncExternalStore } from 'react';
import { rutaInterna } from '@/lib/rutaInterna';
import { useEstadoDemo } from './hooks';
import { CLAVE_ROL, guardarRol, leerRol, sesionDe, type RolDemo, type UsuarioSesion } from './sesionActual';

export interface Session {
  user: UsuarioSesion;
}

export type EstadoSesion = 'loading' | 'authenticated' | 'unauthenticated';

interface ContextoSesion {
  rol: RolDemo | null;
  status: EstadoSesion;
  data: Session | null;
}

const Contexto = createContext<ContextoSesion>({ rol: null, status: 'loading', data: null });

/** Otra pestana cambio de rol. La propia recarga al cambiar: no hace falta avisarse. */
function suscribirRol(aviso: () => void): () => void {
  const enOtraPestana = (e: StorageEvent) => {
    if (e.key === CLAVE_ROL) aviso();
  };
  window.addEventListener('storage', enOtraPestana);
  return () => window.removeEventListener('storage', enOtraPestana);
}

const rolEnElServidor = () => null;

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const estado = useEstadoDemo();
  const rol = useSyncExternalStore<RolDemo | null>(suscribirRol, leerRol, rolEnElServidor);

  const valor = useMemo<ContextoSesion>(() => {
    if (rol === null || estado === null) return { rol, status: 'loading', data: null };
    const user = sesionDe(rol, estado.usuarios);
    return user ? { rol, status: 'authenticated', data: { user } } : { rol, status: 'unauthenticated', data: null };
  }, [rol, estado]);

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useSession(): { status: EstadoSesion; data: Session | null } {
  const { status, data } = useContext(Contexto);
  return { status, data };
}

/** El rol elegido; null hasta hidratar. */
export function useRolDemo(): RolDemo | null {
  return useContext(Contexto).rol;
}

/** Navega recargando: la sesion nueva arranca de cero en toda la pagina. Solo rutas del sitio. */
function irA(destino: string | null | undefined): void {
  window.location.assign(rutaInterna(destino));
}

export function entrarComo(rol: RolDemo, callbackUrl?: string | null): void {
  guardarRol(rol);
  irA(callbackUrl);
}

export async function signOut(opciones?: { callbackUrl?: string }): Promise<void> {
  guardarRol('visitante');
  irA(opciones?.callbackUrl);
}
