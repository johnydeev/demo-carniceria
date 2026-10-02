/**
 * Body de POST /api/cloudinary/signature, validado con Zod. La lista blanca de
 * carpetas vive aca: antes se firmaba cualquier carpeta que mandara el
 * navegador, incluida `catalogo-comun/`, que comparten los clientes.
 */
import { z } from 'zod';
import { CARPETA_PEDIDOS, type TipoArchivo } from './orders/archivos.ts';

/** Solo las carpetas del comercio. */
export const CARPETAS_FIRMABLES = ['productos', 'elancla/banners', CARPETA_PEDIDOS] as const;

const ERROR_PEDIDO = 'Falta el pedido o el tipo de archivo.';

export type PedidoDeFirma =
  | { folder: 'productos' | 'elancla/banners' }
  | { folder: typeof CARPETA_PEDIDOS; pedido: number; tipo: TipoArchivo };

/** Lo que pide la carpeta privada: el numero de pedido (Int de Postgres) y el tipo. */
const DatosDePedido = z.object({
  pedido: z.number({ error: ERROR_PEDIDO }).int({ error: ERROR_PEDIDO }).min(1, { error: ERROR_PEDIDO }).max(2_147_483_647, { error: ERROR_PEDIDO }),
  tipo: z.enum(['ticket', 'comprobante'], { error: ERROR_PEDIDO }),
});

/**
 * Sin carpeta (o con algo que no es texto) se firma `productos`, como antes.
 * Un body que no es objeto cuenta como vacio.
 */
export const FirmaSchema = z
  .preprocess(
    (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {}),
    z.object({
      // `.optional()` antes del transform: en Zod 4 una clave ausente con
      // `z.unknown()` a secas es un error; asi la transformacion corre igual.
      folder: z
        .unknown()
        .optional()
        .transform((v) => (typeof v === 'string' ? v : 'productos'))
        .pipe(z.enum(CARPETAS_FIRMABLES, { error: 'Carpeta no permitida.' })),
      pedido: z.unknown().optional(),
      tipo: z.unknown().optional(),
    })
  )
  .transform((b, ctx): PedidoDeFirma => {
    if (b.folder !== CARPETA_PEDIDOS) return { folder: b.folder };

    // Tickets y comprobantes: el nombre sale del numero de pedido y el tipo.
    const r = DatosDePedido.safeParse({ pedido: b.pedido, tipo: b.tipo });
    if (!r.success) {
      ctx.addIssue({ code: 'custom', message: ERROR_PEDIDO });
      return z.NEVER;
    }
    return { folder: CARPETA_PEDIDOS, pedido: r.data.pedido, tipo: r.data.tipo };
  });
