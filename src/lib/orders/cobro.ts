/**
 * Datos de cobro que carga la semilla en /admin/cobro. Puro, con tests. El
 * tope de 10 MB es el del plan gratuito de Cloudinary.
 */
import { z } from 'zod';

export const MAX_ARCHIVO_TOPE_MB = 10;

const ERROR_TAMANO = `El tamaño máximo va de 1 a ${MAX_ARCHIVO_TOPE_MB} MB.`;

export const CobroSchema = z.object({
  alias: z.string({ error: 'Falta el alias.' }).trim().max(60, { error: 'El alias va hasta 60 caracteres.' }),
  titular: z.string({ error: 'Falta el titular.' }).trim().max(80, { error: 'El titular va hasta 80 caracteres.' }),
  maxArchivoMB: z
    .number({ error: ERROR_TAMANO })
    .int({ error: ERROR_TAMANO })
    .min(1, { error: ERROR_TAMANO })
    .max(MAX_ARCHIVO_TOPE_MB, { error: ERROR_TAMANO }),
});

export type ConfigCobro = z.infer<typeof CobroSchema>;

/** Sin registro guardado. */
export const COBRO_POR_DEFECTO: ConfigCobro = { alias: '', titular: '', maxArchivoMB: MAX_ARCHIVO_TOPE_MB };
