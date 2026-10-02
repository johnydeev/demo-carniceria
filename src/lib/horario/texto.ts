/** El horario para leer (footer, contacto, /pedido, terminos) y para Google. Una sola fuente: la configuracion. */
import { DIAS, type DiaSemana, type HorarioConfig, type Turno } from './esquema.ts';
import { horaLegible } from './tiempo.ts';

export const NOMBRE_DIA: Record<DiaSemana, string> = {
  lunes: 'Lunes',
  martes: 'Martes',
  miercoles: 'Miércoles',
  jueves: 'Jueves',
  viernes: 'Viernes',
  sabado: 'Sábado',
  domingo: 'Domingo',
};

const EN_INGLES: Record<DiaSemana, string> = {
  lunes: 'Monday',
  martes: 'Tuesday',
  miercoles: 'Wednesday',
  jueves: 'Thursday',
  viernes: 'Friday',
  sabado: 'Saturday',
  domingo: 'Sunday',
};

const clave = (turnos: Turno[]) => turnos.map((t) => `${t.abre}-${t.cierra}`).join(',');

export function textoHorario(h: HorarioConfig): string[] {
  const grupos: DiaSemana[][] = [];
  for (const dia of DIAS) {
    const ultimo = grupos.at(-1);
    if (ultimo && clave(h.semana[ultimo[0]]) === clave(h.semana[dia])) ultimo.push(dia);
    else grupos.push([dia]);
  }
  return grupos.map((g) => {
    const primero = NOMBRE_DIA[g[0]];
    const ultimo = NOMBRE_DIA[g[g.length - 1]].toLowerCase();
    const nombre = g.length === 1 ? primero : g.length === 2 ? `${primero} y ${ultimo}` : `${primero} a ${ultimo}`;
    const turnos = h.semana[g[0]];
    if (turnos.length === 0) return `${nombre} cerrado`;
    return `${nombre}: ${turnos.map((t) => `${horaLegible(t.abre)} a ${horaLegible(t.cierra)}`).join(' y ')}`;
  });
}

export interface HorarioJsonLd {
  '@type': 'OpeningHoursSpecification';
  dayOfWeek: string[];
  opens: string;
  closes: string;
}

/** Un bloque por par apertura-cierre, con todos los dias que lo usan. */
export function horarioParaJsonLd(h: HorarioConfig): HorarioJsonLd[] {
  const bloques: HorarioJsonLd[] = [];
  for (const dia of DIAS) {
    for (const t of h.semana[dia]) {
      const b = bloques.find((x) => x.opens === t.abre && x.closes === t.cierra);
      if (b) b.dayOfWeek.push(EN_INGLES[dia]);
      else bloques.push({ '@type': 'OpeningHoursSpecification', dayOfWeek: [EN_INGLES[dia]], opens: t.abre, closes: t.cierra });
    }
  }
  return bloques;
}
