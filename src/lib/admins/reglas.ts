/**
 * Quien puede tocar el rol de admin. Puro, con tests.
 *
 * Puede haber varios admins, pero solo la **semilla** —el email de
 * ADMIN_SEMILLA_EMAIL— agrega o quita admins. La semilla vive en una variable
 * de entorno y no en la base a proposito: nadie puede volverse semilla desde
 * el panel, ni siquiera otro admin. Sin la variable, nadie gestiona admins.
 */

export const normalizarEmail = (email: string | null | undefined): string => (email ?? '').trim().toLowerCase();

export function esSemilla(email: string | null | undefined, semilla: string | null | undefined): boolean {
  const s = normalizarEmail(semilla);
  return s !== '' && normalizarEmail(email) === s;
}

export interface Actor {
  email: string;
  role: 'admin' | 'user';
}

export interface Objetivo {
  email: string;
  role: 'admin' | 'user';
  isActive: boolean;
}

/** null si se puede; si no, el motivo para mostrar. */
export function motivoParaNoHacerAdmin(actor: Actor, objetivo: Objetivo | null, semilla: string | null | undefined): string | null {
  if (!normalizarEmail(semilla)) return 'Falta configurar el administrador principal (ADMIN_SEMILLA_EMAIL).';
  if (actor.role !== 'admin' || !esSemilla(actor.email, semilla)) return 'Solo el administrador principal puede agregar administradores.';
  if (objetivo && !objetivo.isActive) return 'Esa cuenta está desactivada.';
  if (objetivo?.role === 'admin') return 'Esa cuenta ya es administradora.';
  return null;
}

export function motivoParaNoQuitarAdmin(actor: Actor, objetivo: Objetivo, semilla: string | null | undefined): string | null {
  if (!normalizarEmail(semilla)) return 'Falta configurar el administrador principal (ADMIN_SEMILLA_EMAIL).';
  if (actor.role !== 'admin' || !esSemilla(actor.email, semilla)) return 'Solo el administrador principal puede quitar administradores.';
  if (esSemilla(objetivo.email, semilla)) return 'El administrador principal no se puede quitar.';
  if (objetivo.role !== 'admin') return 'Esa cuenta no es administradora.';
  return null;
}

/** Forma basica de un email: algo@algo.algo, sin espacios. */
export const pareceEmail = (email: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
