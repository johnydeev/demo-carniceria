/**
 * Logica pura de los carteles del carrusel. Sin Prisma ni Cloudinary, para
 * poder probarla sin red. Ver docs/decisiones.md #018.
 */

import { inicioOFinDeDia } from './fechas.ts';

export const BANNER_ANCHO = 1200;
export const BANNER_ALTO = 500;

export interface BannerVigencia {
  isActive: boolean;
  order: number;
  startsAt: Date | null;
  endsAt: Date | null;
}

/**
 * Los que se muestran ahora: activos, dentro de su rango de fechas si lo
 * tienen, ordenados por `order`. Los extremos del rango cuentan como dentro.
 */
export function bannersVigentes<T extends BannerVigencia>(banners: T[], ahora: Date): T[] {
  const t = ahora.getTime();

  return banners
    .filter((b) => b.isActive)
    .filter((b) => !b.startsAt || b.startsAt.getTime() <= t)
    .filter((b) => !b.endsAt || b.endsAt.getTime() >= t)
    .sort((a, b) => a.order - b.order);
}

/** null si las medidas son las exactas; si no, el mensaje para mostrarle al duenio. */
export function validarDimensiones(ancho: number, alto: number): string | null {
  if (ancho === BANNER_ANCHO && alto === BANNER_ALTO) return null;

  return `La imagen mide ${ancho}×${alto}. Tiene que medir exactamente ${BANNER_ANCHO}×${BANNER_ALTO}.`;
}

/**
 * Fecha YYYY-MM-DD del formulario a Date **en hora argentina**. Con
 * `finDeDia`, el ultimo instante del dia: asi un endsAt del 20 incluye todo
 * el 20. Antes se tomaba en la hora del servidor —UTC en Vercel— y un cartel
 * "hasta el 20" se apagaba el 20 a las 20:59.
 */
export function parsearFecha(valor: unknown, finDeDia: boolean): Date | null {
  if (typeof valor !== 'string') return null;
  return inicioOFinDeDia(valor, finDeDia);
}

export const ERROR_FECHAS = 'La fecha "Hasta" no puede ser anterior a "Desde".';

/**
 * null si el rango de vigencia tiene sentido; si no, el mensaje. Sin alguna de
 * las dos fechas no hay nada que comparar. El mismo dia vale: `startsAt` es el
 * inicio del dia y `endsAt` el final.
 */
export function errorDeFechas(startsAt: Date | null, endsAt: Date | null): string | null {
  if (!startsAt || !endsAt) return null;
  return endsAt.getTime() < startsAt.getTime() ? ERROR_FECHAS : null;
}

/**
 * El enlace de un cartel: una ruta del sitio ("/productos/carniceria") o una
 * URL https. Nada de `javascript:`, `data:` ni `//otro.sitio`. Vacio es valido
 * (el cartel no enlaza). Devuelve el enlace limpio, `null` si viene vacio, o
 * `false` si no es valido.
 */
export function enlaceCartel(valor: unknown): string | null | false {
  if (typeof valor !== 'string' || valor.trim() === '') return null;
  const v = valor.trim();
  if (v.length > 500) return false;
  if (v.startsWith('/') && !v.startsWith('//') && !v.startsWith('/\\')) return v;
  try {
    const u = new URL(v);
    return u.protocol === 'https:' ? u.toString() : false;
  } catch {
    return false;
  }
}

/**
 * Si el enlace de un cartel lleva a otro sitio (un post de Instagram, WhatsApp):
 * se abre en una pestana nueva para no sacar al cliente de la tienda. Las rutas
 * del sitio y las URL del propio dominio (con o sin www) siguen en la misma.
 */
export function esEnlaceExterno(link: string, dominio: string): boolean {
  if (!link.startsWith('https://')) return false;
  const sinWww = (host: string) => host.replace(/^www\./, '');
  try {
    return sinWww(new URL(link).hostname) !== sinWww(new URL(dominio).hostname);
  } catch {
    return false;
  }
}
