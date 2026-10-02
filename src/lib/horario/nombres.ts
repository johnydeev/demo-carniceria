/**
 * Como se nombra un turno. La parte del dia sale solo de las horas del turno
 * (el pedido guarda una copia del turno y nada mas): "todo el dia" si empieza
 * antes de las 13 y termina despues de las 15; si no, manana o tarde segun
 * empiece antes o despues de las 13.
 */
import type { TurnoOfrecido } from './turnos';
import { DIA_MS, enArgentina, fechaCorta, horaDe, inicioDelDia, minutosDelDia } from './tiempo.ts';

const DIAS_NOMBRE = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const TRECE = 13 * 60;
const QUINCE = 15 * 60;

function parte(t: TurnoOfrecido): string {
  const inicio = minutosDelDia(t.inicio.getTime());
  const fin = minutosDelDia(t.fin.getTime());
  if (inicio < TRECE && fin > QUINCE) return 'todo el día';
  return inicio < TRECE ? 'por la mañana' : 'por la tarde';
}

const horas = (t: TurnoOfrecido) => `(${horaDe(t.inicio.getTime())} a ${horaDe(t.fin.getTime())})`;
const diaYFecha = (ms: number) => `${DIAS_NOMBRE[enArgentina(ms).getUTCDay()]} ${fechaCorta(ms)}`;

/** Relativo a `ahora`: para la pantalla en vivo y el panel. */
export function nombreTurno(t: TurnoOfrecido, ahora: Date): string {
  const dias = Math.round((inicioDelDia(t.inicio.getTime()) - inicioDelDia(ahora.getTime())) / DIA_MS);
  const dia =
    dias === 0 ? 'Hoy' : dias === 1 ? 'Mañana' : dias === -1 ? 'Ayer' : capitalizar(diaYFecha(t.inicio.getTime()));
  return `${dia} ${parte(t)} ${horas(t)}`;
}

/** Absoluto: para lo que se lee despues (WhatsApp, detalle del pedido). */
export function nombreTurnoAbsoluto(t: TurnoOfrecido): string {
  return `${diaYFecha(t.inicio.getTime())} ${parte(t)} ${horas(t)}`;
}

const capitalizar = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
