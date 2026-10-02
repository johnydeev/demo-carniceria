import { z } from 'zod';

/**
 * Valida un body con Zod y devuelve el dato o el primer mensaje de error.
 * Un solo mensaje alcanza: el formulario lo muestra debajo del boton.
 */
export function validar<S extends z.ZodType>(
  schema: S,
  body: unknown
): { ok: true; datos: z.output<S> } | { ok: false; error: string } {
  const r = schema.safeParse(body);
  if (r.success) return { ok: true, datos: r.data };
  return { ok: false, error: r.error.issues[0]?.message ?? 'Datos inválidos.' };
}
