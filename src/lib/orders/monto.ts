/**
 * El monto real del ticket, escrito como lo escribe un argentino: "45.300",
 * "45.300,50", "45300". Puro, con tests. El punto es separador de miles y la
 * coma es decimal —la trampa que ya tuvo la hoja, que leia "1500.5" como
 * 15005—: un "45.5" es ambiguo y se rechaza.
 */
export const ERROR_MONTO = 'Escribí el monto como 45.300 o 45.300,50';

/** Tope: un ticket de cien millones es un error de tipeo. */
const TOPE = 100_000_000;

const CON_MILES = /^\d{1,3}(\.\d{3})+(,\d+)?$/;
const SIN_MILES = /^\d+(,\d+)?$/;

/**
 * Lo que se va escribiendo en el campo del monto, con los miles separados:
 * "80000" → "80.000", "45300,5" → "45.300,5". Solo quedan digitos y la
 * primera coma (decimal, hasta dos); los puntos que haya se descartan y se
 * vuelven a poner, asi borrar un digito de "80.000" regrupa. El resultado
 * siempre lo lee parsearMonto.
 *
 * `anterior` es lo que habia en el campo. Muchos teclados de celular muestran
 * "." como tecla decimal: un punto tipeado al final (sin coma todavia) es la
 * coma, y no se descarta. Y un "45300.50" pegado lee el punto como decimal.
 * Un borrado nunca: de "80.000" a "80.00" es sacar un cero.
 */
export function formatearMontoEscrito(texto: string, anterior = ''): string {
  const esBorrado = texto.length < anterior.length;
  if (!esBorrado && !anterior.includes(',') && texto === `${anterior}.`) {
    return `${formatearMontoEscrito(anterior)},`.replace(/^,/, '0,');
  }
  if (!esBorrado && !texto.includes(',') && /^\d+\.\d{1,2}$/.test(texto.replace(/[\s$]/g, ''))) {
    return formatearMontoEscrito(texto.replace(/[\s$]/g, '').replace('.', ','));
  }
  const soloValidos = texto.replace(/[^\d,]/g, '');
  const coma = soloValidos.indexOf(',');
  const entero = (coma === -1 ? soloValidos : soloValidos.slice(0, coma)).replace(/^0+(?=\d)/, '');
  const decimales = coma === -1 ? null : soloValidos.slice(coma + 1).replace(/,/g, '').slice(0, 2);
  const conMiles = entero.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  if (decimales === null) return conMiles;
  return `${conMiles || '0'},${decimales}`;
}

/** El monto en pesos, redondeado a 2 decimales; null si no se puede leer, es 0 o pasa el tope. */
export function parsearMonto(texto: string): number | null {
  const limpio = texto.replace(/[\s$]/g, '');
  if (!CON_MILES.test(limpio) && !SIN_MILES.test(limpio)) return null;
  const n = Number(limpio.replace(/\./g, '').replace(',', '.'));
  const redondeado = Math.round(n * 100) / 100;
  if (!Number.isFinite(redondeado) || redondeado <= 0 || redondeado >= TOPE) return null;
  return redondeado;
}
