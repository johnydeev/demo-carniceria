/**
 * Aritmetica de hora argentina para el horario. UTC-3 fijo, como fechas.ts:
 * se corre el instante 3 horas y se leen los campos UTC. Todo en milisegundos.
 */
export const OFFSET_MS = 3 * 60 * 60 * 1000;
export const DIA_MS = 24 * 60 * 60 * 1000;

/** El mismo instante con los campos UTC mostrando la hora argentina. */
export const enArgentina = (ms: number) => new Date(ms - OFFSET_MS);

/** 00:00 hora argentina del dia de `ms`. */
export function inicioDelDia(ms: number): number {
  const a = enArgentina(ms);
  return Date.UTC(a.getUTCFullYear(), a.getUTCMonth(), a.getUTCDate()) + OFFSET_MS;
}

/** "YYYY-MM-DD" del dia argentino de `ms`. */
export const fechaISO = (ms: number) => enArgentina(inicioDelDia(ms)).toISOString().slice(0, 10);

/** "08:15" -> 495. */
export function minutosDeHora(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

/** Minutos desde las 00:00 argentinas del instante. */
export function minutosDelDia(ms: number): number {
  const a = enArgentina(ms);
  return a.getUTCHours() * 60 + a.getUTCMinutes();
}

/** "08:15" -> "8:15": como se escribe la hora para leer. */
export const horaLegible = (hhmm: string) => `${Number(hhmm.slice(0, 2))}:${hhmm.slice(3, 5)}`;

/** La hora argentina del instante, para leer: "17:00", "8:15". */
export function horaDe(ms: number): string {
  const a = enArgentina(ms);
  return `${a.getUTCHours()}:${String(a.getUTCMinutes()).padStart(2, '0')}`;
}

/** "30/9" del dia argentino. */
export function fechaCorta(ms: number): string {
  const a = enArgentina(ms);
  return `${a.getUTCDate()}/${a.getUTCMonth() + 1}`;
}
