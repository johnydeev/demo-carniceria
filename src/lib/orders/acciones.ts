/**
 * El body de PUT /api/admin/orders/[id]: `{ accion, ...datos }`, validado con
 * Zod por accion. Vive aca y no en la ruta porque un route.ts de Next no
 * puede exportar nada que no sea un handler, y el servicio necesita el tipo.
 * Que la accion corresponda al estado lo decide requisitosPara, no este esquema.
 */
import { z } from 'zod';
import { METODOS } from './estados.ts';
import { ERROR_MONTO, parsearMonto } from './monto.ts';

const archivo = (error: string) => z.string({ error }).trim().min(1, { error }).max(255, { error });

/** El monto llega como texto ("45.300,50") y sale como numero. */
const monto = z
  .string({ error: ERROR_MONTO })
  .refine((v) => parsearMonto(v) !== null, { error: ERROR_MONTO })
  .transform((v) => parsearMonto(v) as number);

const texto = (max: number, error: string) =>
  z
    .string()
    .trim()
    .max(max, { error })
    .optional()
    .transform((v) => v || null);

export const AccionSchema = z.discriminatedUnion(
  'accion',
  [
    z.object({ accion: z.literal('aceptar'), stockConfirmado: z.boolean().optional() }),
    z.object({
      accion: z.literal('cargarTicket'),
      ticketPublicId: archivo('Falta cargar el ticket.'),
      montoReal: monto,
    }),
    z.object({
      accion: z.literal('corregirTicket'),
      ticketPublicId: archivo('Falta cargar el ticket.').optional(),
      montoReal: monto.optional(),
    }),
    z.object({
      accion: z.literal('registrarPago'),
      metodoPago: z.enum(METODOS, { error: 'Elegí el método de pago.' }),
      comprobantePublicId: archivo('Falta el comprobante.').optional(),
      verificado: z.boolean().optional(),
    }),
    z.object({
      accion: z.literal('registrarEntrega'),
      metodoPago: z.enum(METODOS, { error: 'Elegí el método de pago.' }).optional(),
      comprobantePublicId: archivo('Falta el comprobante.').optional(),
      verificado: z.boolean().optional(),
      cobrado: z.boolean().optional(),
    }),
    z.object({
      accion: z.literal('cambiarModalidad'),
      delivery: z.enum(['retiro', 'envio'], { error: 'Elegí retiro o envío.' }),
      address: texto(160, 'La dirección es muy larga.'),
      addressNotes: texto(160, 'Las notas de dirección son muy largas.'),
    }),
    z.object({
      accion: z.literal('cancelar'),
      motivo: texto(300, 'El motivo es muy largo.'),
    }),
  ],
  { error: 'Acción inválida. Recargá la página.' }
);

export type AccionPedido = z.output<typeof AccionSchema>;
