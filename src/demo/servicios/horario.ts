/**
 * Portado de `obtenerHorario()` (src/services/horario.service.ts): para
 * mostrar, nunca falla. Un horario guardado que no valida cae al de por
 * defecto, como en la app real.
 */
import { HorarioSchema, type HorarioConfig } from '../../lib/horario/esquema.ts';
import { HORARIO_POR_DEFECTO } from '../../lib/horario/porDefecto.ts';
import type { EstadoDemo } from '../tipos';

export function horarioDe(e: Pick<EstadoDemo, 'horario'>): HorarioConfig {
  const r = HorarioSchema.safeParse(e.horario);
  return r.success ? r.data : HORARIO_POR_DEFECTO;
}
