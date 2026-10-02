/**
 * Quien esta mirando la demo. Sin Google ni NextAuth: el rol elegido en la
 * barra (o en el login de la demo) se guarda en `localStorage` y se traduce al
 * usuario de la semilla. Lo usan `sesion.tsx` (la API compatible con
 * next-auth/react) y los handlers, en lugar de `getServerSession`.
 */
import { almacen, leer } from './store.ts';
import { ID_CLIENTE_DEMO, ID_DUENIO_DEMO } from './semilla.ts';
import type { UsuarioDemo } from './tipos';

export type RolDemo = 'visitante' | 'cliente' | 'duenio';

export const ROLES: readonly RolDemo[] = ['visitante', 'cliente', 'duenio'];

export const NOMBRE_ROL: Record<RolDemo, string> = {
  visitante: 'Visitante',
  cliente: 'Cliente',
  duenio: 'Dueño',
};

export const CLAVE_ROL = 'demo.rol';

/** Sin `localStorage` el rol dura lo que dura la pagina, como el resto de la demo. */
let rolEnMemoria: RolDemo = 'visitante';

export function esRol(valor: unknown): valor is RolDemo {
  return typeof valor === 'string' && (ROLES as readonly string[]).includes(valor);
}

export function leerRol(): RolDemo {
  const ls = almacen();
  const valor = ls ? ls.getItem(CLAVE_ROL) : rolEnMemoria;
  return esRol(valor) ? valor : 'visitante';
}

export function guardarRol(rol: RolDemo): void {
  const ls = almacen();
  if (ls) ls.setItem(CLAVE_ROL, rol);
  else rolEnMemoria = rol;
}

/** La forma de `session.user` de la app real (src/types/next-auth.d.ts). */
export interface UsuarioSesion {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: 'admin' | 'user';
  /** Cuenta desactivada o borrada con la sesion abierta. */
  bloqueado?: boolean;
}

/**
 * La sesion del rol. Un usuario desactivado o borrado queda como el token de la
 * app real: `bloqueado`, sin id y con rol `user`; navbar y carrito lo muestran
 * como visitante.
 */
export function sesionDe(rol: RolDemo, usuarios: UsuarioDemo[]): UsuarioSesion | null {
  if (rol === 'visitante') return null;
  const id = rol === 'duenio' ? ID_DUENIO_DEMO : ID_CLIENTE_DEMO;
  const u = usuarios.find((x) => x.id === id);
  if (!u || !u.isActive) {
    return { id: '', name: u?.name ?? null, email: u?.email ?? null, image: u?.image ?? null, role: 'user', bloqueado: true };
  }
  return { id: u.id, name: u.name, email: u.email, image: u.image, role: u.role };
}

/** Para los handlers: quien hace el pedido, o null si no hay sesion valida (401). */
export function usuarioActual(): { id: string; role: 'admin' | 'user' } | null {
  const s = sesionDe(leerRol(), leer().usuarios);
  if (!s || s.bloqueado || !s.id) return null;
  return { id: s.id, role: s.role };
}
