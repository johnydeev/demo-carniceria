/**
 * Bodies de las rutas de carteles, validados con Zod. Las reglas son las de
 * siempre (`enlaceCartel`, `parsearFecha`): el esquema solo las junta y suma
 * el chequeo de que "Hasta" no quede antes de "Desde".
 *
 * Ojo con Zod 4: una clave ausente con `z.unknown()` a secas es un error
 * ("expected nonoptional"). `z.unknown().optional().transform(f)` corre `f`
 * tambien con la clave ausente; `z.unknown().transform(f).optional()` no la
 * corre y deja la clave afuera. El POST usa la primera forma (todo campo tiene
 * valor) y el PUT la segunda (lo que no viene no se toca).
 */
import { z } from 'zod';
import { enlaceCartel, errorDeFechas, parsearFecha } from './banners.ts';

export const ERROR_ENLACE = 'El enlace tiene que ser una ruta del sitio (/productos) o una URL https.';
export const ERROR_OBLIGATORIOS = 'La imagen y el texto alternativo son obligatorios.';

const cualquiera = z.unknown().optional();

/** Texto recortado; cualquier otra cosa, o nada, cuenta como vacio. */
const obligatorio = cualquiera
  .transform((v) => (typeof v === 'string' ? v.trim() : ''))
  .pipe(z.string().min(1, { error: ERROR_OBLIGATORIOS }));

/** `null` si viene vacio; un enlace invalido corta con el mensaje de siempre. */
function aEnlace(v: unknown, ctx: z.RefinementCtx) {
  const e = enlaceCartel(v);
  if (e === false) {
    ctx.addIssue({ code: 'custom', message: ERROR_ENLACE });
    return z.NEVER;
  }
  return e;
}

/**
 * POST /api/admin/banners. El enlace va primero: con un enlace invalido y la
 * imagen faltante, el mensaje es el del enlace, como antes. Una fecha ilegible
 * cuenta como sin fecha, como antes.
 */
export const NuevoBannerSchema = z
  .object(
    {
      linkUrl: cualquiera.transform(aEnlace),
      imagePublicId: obligatorio,
      alt: obligatorio,
      startsAt: cualquiera.transform((v) => parsearFecha(v, false)),
      endsAt: cualquiera.transform((v) => parsearFecha(v, true)),
    },
    { error: ERROR_OBLIGATORIOS }
  )
  .superRefine((b, ctx) => {
    const error = errorDeFechas(b.startsAt, b.endsAt);
    if (error) ctx.addIssue({ code: 'custom', message: error, path: ['endsAt'] });
  });

export interface CambiosBannerBody {
  isActive?: boolean;
  alt?: string;
  linkUrl?: string | null;
  startsAt?: Date | null;
  endsAt?: Date | null;
}

export type ActualizacionBanner = { mover: 'arriba' | 'abajo' } | { cambios: CambiosBannerBody };

/**
 * PUT /api/admin/banners/[id]. Dos usos: `{ mover: 'arriba' | 'abajo' }`
 * reordena; cualquier otro cuerpo actualiza campos. Un campo que no viene no se
 * toca; `isActive` que no es booleano y `alt` vacio se ignoran, como antes.
 * `linkUrl` y las fechas en `null` o vacias los borran. Si vienen las dos
 * fechas se comparan aca; con una sola, el servicio la compara con la guardada.
 */
export const ActualizarBannerSchema = z
  .object(
    {
      mover: cualquiera,
      isActive: cualquiera,
      alt: cualquiera,
      linkUrl: z.unknown().transform(aEnlace).optional(),
      startsAt: z.unknown().transform((v) => parsearFecha(v, false)).optional(),
      endsAt: z.unknown().transform((v) => parsearFecha(v, true)).optional(),
    },
    { error: 'Datos inválidos.' }
  )
  .superRefine((b, ctx) => {
    if (b.mover === 'arriba' || b.mover === 'abajo') return;
    const error = errorDeFechas(b.startsAt ?? null, b.endsAt ?? null);
    if (error) ctx.addIssue({ code: 'custom', message: error, path: ['endsAt'] });
  })
  .transform((b): ActualizacionBanner => {
    if (b.mover === 'arriba' || b.mover === 'abajo') return { mover: b.mover };

    const cambios: CambiosBannerBody = {};
    if (typeof b.isActive === 'boolean') cambios.isActive = b.isActive;
    if (typeof b.alt === 'string' && b.alt.trim()) cambios.alt = b.alt.trim();
    if (b.linkUrl !== undefined) cambios.linkUrl = b.linkUrl;
    if (b.startsAt !== undefined) cambios.startsAt = b.startsAt;
    if (b.endsAt !== undefined) cambios.endsAt = b.endsAt;
    return { cambios };
  });
