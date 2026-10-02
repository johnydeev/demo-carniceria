/**
 * Reglas de cantidad del carrito. Puras, con tests.
 *
 * Por kilo se pide en pasos de 0,5: "medio kilo de milanesas" sin tipear
 * decimales. Unidad, docena y caja van en enteros. Un pack —producto
 * con quantity distinta de 1, como "Asado x 3 kg", "Huevos x 30" o
 * "Matambre x 0,5 kg"— se pide por pack: cantidad 1 = un pack al precio
 * del producto. Una oferta con quantity 1
 * (precio promocional por kilo) no es paquete: se pide como cualquier kilo
 * suelto.
 *
 * Una pieza de peso variable ("Asado x Plancha", 10 kg aprox., precio por
 * kilo) se pide de a una y se estima con ese peso; el real sale de la
 * balanza y se confirma por WhatsApp. Una caja es siempre precio cerrado:
 * va como pack (cantidad = kilos que trae), sin peso aproximado.
 */

export interface ReglaCantidad {
  unit: string;
  isOffer: boolean;
  /** Cantidad del producto: lo que trae un pack. */
  quantity: number;
  /** Peso aproximado en kg si se vende por pieza; null o ausente si no. */
  pesoAprox?: number | null;
}

export const MAXIMO = 50;

/** Pieza de peso variable: se pide de a una y se estima con el peso aproximado. */
export function esPieza(p: ReglaCantidad): boolean {
  return typeof p.pesoAprox === 'number' && p.pesoAprox > 0;
}

/**
 * Paquete: precio cerrado por la cantidad que trae, se pide por pack y no
 * por unidad suelta. Solo la cantidad decide; isOffer no. Cualquier cantidad
 * distinta de 1 es pack, tambien una menor: "x 0,5 kg" a precio cerrado
 * tratado como kilo suelto se cobraba a la mitad (precio × 0,5). Una
 * cantidad no positiva es un dato roto y no se trata como pack. Toda
 * decision de "es pack" del sitio pasa por aca.
 */
export function esPaquete(p: ReglaCantidad): boolean {
  return Number.isFinite(p.quantity) && p.quantity > 0 && p.quantity !== 1;
}

export function paso(p: ReglaCantidad): number {
  return !esPaquete(p) && !esPieza(p) && p.unit === 'Kg' ? 0.5 : 1;
}

export function minimo(p: ReglaCantidad): number {
  return paso(p);
}

/** Redondea al paso de la unidad y acota entre minimo y MAXIMO. NaN cae al minimo. */
export function ajustar(cantidad: number, p: ReglaCantidad): number {
  const s = paso(p);
  if (!Number.isFinite(cantidad)) return minimo(p);
  const redondeada = Math.round(cantidad / s) * s;
  return Math.min(MAXIMO, Math.max(minimo(p), redondeada));
}

const NOMBRES: Record<string, [string, string]> = {
  Kg: ['kg', 'kg'],
  Unidad: ['u', 'u'],
  Docena: ['docena', 'docenas'],
  Caja: ['caja', 'cajas'],
};

function nombreUnidad(unit: string, cantidad: number): string {
  const [singular, plural] = NOMBRES[unit] ?? [unit.toLowerCase(), unit.toLowerCase()];
  return cantidad === 1 ? singular : plural;
}

const numero = (n: number) => n.toLocaleString('es-AR', { maximumFractionDigits: 1 });

export function formatearCantidad(cantidad: number, p: ReglaCantidad): string {
  if (esPieza(p)) {
    return `${numero(cantidad)} ${cantidad === 1 ? 'pieza' : 'piezas'}`;
  }
  if (esPaquete(p)) {
    return `${numero(cantidad)} × ${numero(p.quantity)} ${nombreUnidad(p.unit, p.quantity)}`;
  }
  return `${numero(cantidad)} ${nombreUnidad(p.unit, cantidad)}`;
}

/**
 * Lo que vale una unidad de cantidad. Para una pieza, el precio por kilo por
 * el peso aproximado: es un estimado, el real sale de la balanza. Para el
 * resto, el precio del producto tal cual.
 */
export function precioEfectivo(price: number, p: ReglaCantidad): number {
  return esPieza(p) ? Math.round(price * (p.pesoAprox as number)) : price;
}

/** Subtotal de una linea en pesos enteros. */
export function subtotal(price: number, cantidad: number, p: ReglaCantidad): number {
  return Math.round(precioEfectivo(price, p) * cantidad);
}
