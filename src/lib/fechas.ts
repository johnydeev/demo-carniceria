/**
 * Fechas del comercio, siempre en hora argentina. Puro, con tests.
 *
 * En Vercel el servidor corre en UTC: un `toLocaleString` sin zona en un Server
 * Component mostraba un pedido de las 20:00 como de las 23:00 (y despues de las
 * 21:00, con el dia siguiente), y un cartel "hasta el 20" se apagaba el 20 a las
 * 20:59. Argentina no tiene horario de verano desde 2009: UTC-3 fijo.
 */
export const ZONA = 'America/Argentina/Buenos_Aires';
const OFFSET = '-03:00';

/** "20 sept, 14:05": listas de pedidos del cliente. */
export const fechaHoraCorta = (iso: string | Date) =>
  new Date(iso).toLocaleDateString('es-AR', { timeZone: ZONA, hourCycle: 'h23', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

/** "20/09, 14:05": panel de pedidos. */
export const fechaHoraNumerica = (iso: string | Date) =>
  new Date(iso).toLocaleString('es-AR', { timeZone: ZONA, hourCycle: 'h23', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

/** "20/9/2026, 14:05:03": marcas de tiempo del panel. */
export const fechaHoraCompleta = (iso: string | Date) => new Date(iso).toLocaleString('es-AR', { timeZone: ZONA, hourCycle: 'h23' });

/** "20/9/2026". */
export const soloFecha = (iso: string | Date) => new Date(iso).toLocaleDateString('es-AR', { timeZone: ZONA });

/**
 * "YYYY-MM-DD" de un <input type="date"> como instante en hora argentina: el
 * primer milisegundo del dia, o el ultimo si `finDeDia`. Null si no es una fecha.
 */
export function inicioOFinDeDia(valor: string, finDeDia: boolean): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return null;
  const fecha = new Date(`${valor}T${finDeDia ? '23:59:59.999' : '00:00:00.000'}${OFFSET}`);
  if (Number.isNaN(fecha.getTime())) return null;
  // `new Date` acepta "2026-02-30" y lo corre a marzo: se descarta.
  const [a, m, d] = valor.split('-').map(Number);
  const enZona = new Date(fecha.getTime() - 3 * 60 * 60 * 1000);
  if (enZona.getUTCFullYear() !== a || enZona.getUTCMonth() + 1 !== m || enZona.getUTCDate() !== d) return null;
  return fecha;
}

/**
 * Año en hora argentina. En el servidor (UTC) `getFullYear()` daba el año
 * siguiente entre las 21:00 y las 24:00 del 31 de diciembre.
 */
export function anioEnArgentina(fecha: Date = new Date()): number {
  return new Date(fecha.getTime() - 3 * 60 * 60 * 1000).getUTCFullYear();
}
