/**
 * Forma del horario guardado en Configuracion.horario, validada con Zod al
 * leer y al guardar. Los mensajes nombran el dia: el panel muestra el primero.
 */
import { z } from 'zod';
import { inicioOFinDeDia } from '../fechas.ts';
import { minutosDeHora } from './tiempo.ts';

export const DIAS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'] as const;
export type DiaSemana = (typeof DIAS)[number];

/** Tope de la anticipacion configurable; las metricas lo usan para ampliar su rango. */
export const ANTICIPACION_MAXIMA_DIAS = 5;

const NOMBRE: Record<DiaSemana, string> = {
  lunes: 'Lunes',
  martes: 'Martes',
  miercoles: 'Miércoles',
  jueves: 'Jueves',
  viernes: 'Viernes',
  sabado: 'Sábado',
  domingo: 'Domingo',
};

const HORA = /^([01]\d|2[0-3]):[0-5]\d$/;

// Formato y cantidad se chequean en superRefine, no aca: asi el mensaje nombra
// el dia (el panel tiene 28 campos de hora y muestra un solo error).
const TurnoSchema = z.object({ abre: z.string(), cierra: z.string() });

const turnosDelDia = z.array(TurnoSchema);

const margen = z
  .number()
  .int({ error: 'El margen va de 0 a 240 minutos.' })
  .min(0, { error: 'El margen va de 0 a 240 minutos.' })
  .max(240, { error: 'El margen va de 0 a 240 minutos.' });

export const HorarioSchema = z
  .object({
    semana: z.object({
      lunes: turnosDelDia,
      martes: turnosDelDia,
      miercoles: turnosDelDia,
      jueves: turnosDelDia,
      viernes: turnosDelDia,
      sabado: turnosDelDia,
      domingo: turnosDelDia,
    }),
    margenRetiroMin: margen,
    margenEnvioMin: margen,
    diasAnticipacion: z
      .number()
      .int({ error: 'La anticipación va de 1 a 5 días.' })
      .min(1, { error: 'La anticipación va de 1 a 5 días.' })
      .max(ANTICIPACION_MAXIMA_DIAS, { error: 'La anticipación va de 1 a 5 días.' }),
    fechasCerradas: z
      .array(
        z.string().refine((f) => inicioOFinDeDia(f, false) !== null, { error: 'Fecha cerrada inválida.' })
      )
      .max(366),
  })
  .superRefine((h, ctx) => {
    for (const dia of DIAS) {
      const turnos = h.semana[dia];
      if (turnos.length > 2) {
        ctx.addIssue({ code: 'custom', message: `${NOMBRE[dia]}: hasta dos turnos por día.`, path: ['semana', dia] });
        continue;
      }
      if (turnos.some((t) => !HORA.test(t.abre) || !HORA.test(t.cierra))) {
        ctx.addIssue({ code: 'custom', message: `${NOMBRE[dia]}: hora inválida, usá HH:MM.`, path: ['semana', dia] });
        continue;
      }
      for (const [i, t] of turnos.entries()) {
        if (minutosDeHora(t.cierra) <= minutosDeHora(t.abre)) {
          ctx.addIssue({
            code: 'custom',
            message: `${NOMBRE[dia]}: el cierre tiene que ser después de la apertura.`,
            path: ['semana', dia, i],
          });
        }
      }
      if (turnos.length === 2 && minutosDeHora(turnos[1].abre) < minutosDeHora(turnos[0].cierra)) {
        ctx.addIssue({ code: 'custom', message: `${NOMBRE[dia]}: los turnos no se pueden pisar.`, path: ['semana', dia] });
      }
    }
  });

export type HorarioConfig = z.infer<typeof HorarioSchema>;
export type Turno = z.infer<typeof TurnoSchema>;
