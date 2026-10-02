/**
 * Que turnos se le ofrecen al cliente. Pura, con tests, en hora argentina.
 * Un turno se ofrece mientras no paso su corte (cierre menos el margen de la
 * modalidad), aunque ya haya empezado.
 */
import { DIAS, type HorarioConfig } from './esquema.ts';
import { DIA_MS, enArgentina, fechaISO, inicioDelDia, minutosDeHora } from './tiempo.ts';

export type Modalidad = 'retiro' | 'envio';

export interface TurnoOfrecido {
  inicio: Date;
  fin: Date;
}

const diaDeSemana = (inicioDia: number) => DIAS[(enArgentina(inicioDia).getUTCDay() + 6) % 7];

export function turnosDisponibles(h: HorarioConfig, modalidad: Modalidad, ahora: Date): TurnoOfrecido[] {
  const margenMs = (modalidad === 'retiro' ? h.margenRetiroMin : h.margenEnvioMin) * 60_000;
  const cerradas = new Set(h.fechasCerradas);
  const hoy = inicioDelDia(ahora.getTime());
  const turnos: TurnoOfrecido[] = [];

  for (let d = 0; d < h.diasAnticipacion; d++) {
    const dia = hoy + d * DIA_MS;
    if (cerradas.has(fechaISO(dia))) continue;
    for (const t of h.semana[diaDeSemana(dia)]) {
      const inicio = dia + minutosDeHora(t.abre) * 60_000;
      const fin = dia + minutosDeHora(t.cierra) * 60_000;
      if (ahora.getTime() > fin - margenMs) continue;
      turnos.push({ inicio: new Date(inicio), fin: new Date(fin) });
    }
  }
  return turnos;
}

/** El turno completo si `inicio` es uno de los ofrecidos ahora; null si no. El servidor nunca usa el fin que manda el cliente. */
export function esTurnoValido(h: HorarioConfig, modalidad: Modalidad, ahora: Date, inicio: Date): TurnoOfrecido | null {
  return turnosDisponibles(h, modalidad, ahora).find((t) => t.inicio.getTime() === inicio.getTime()) ?? null;
}

/** Fechas cerradas sin las pasadas ni repetidas, ordenadas. Se aplica al guardar. */
export function limpiarFechasPasadas(h: HorarioConfig, ahora: Date): HorarioConfig {
  const hoy = fechaISO(ahora.getTime());
  return { ...h, fechasCerradas: [...new Set(h.fechasCerradas)].filter((f) => f >= hoy).sort() };
}
