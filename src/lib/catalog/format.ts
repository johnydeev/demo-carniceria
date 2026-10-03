import { formatPrice } from '../productUtils.ts';
import { esPaquete } from '../cart/cantidades.ts';

/** Pack o no lo decide la misma regla del carrito: cualquier cantidad distinta de 1. */
const esPack = (unit: string, quantity: number) => esPaquete({ unit, isOffer: false, quantity });

/**
 * Arma la etiqueta de unidad de una tarjeta.
 * Un producto de cantidad 1 muestra solo la unidad: "por kg".
 * Un pack muestra la cantidad que trae: "por 3 kg", "por 0,5 kg".
 */
export function formatUnitLabel(unit: string, quantity: number): string {
  const nombres: Record<string, [string, string]> = {
    Kg: ['kg', 'kg'],
    Unidad: ['u', 'u'],
    Docena: ['docena', 'docenas'],
    Caja: ['caja', 'cajas'],
  };

  const [singular, plural] = nombres[unit] ?? [unit.toLowerCase(), unit.toLowerCase()];

  if (!esPack(unit, quantity)) return `por ${singular}`;

  return `por ${quantity.toLocaleString('es-AR', { maximumFractionDigits: 3 })} ${plural}`;
}

/**
 * Precio por unidad de una promocion por cantidad: "$ 1.500 por kg".
 *
 * Es un valor **derivado**, no un dato guardado. Guardarlo seria tener el mismo
 * numero en dos lugares: al cambiar el precio en la hoja, el unitario guardado
 * quedaria viejo y mentiria. Calculado, siempre coincide.
 *
 * Devuelve undefined cuando no aporta nada: con cantidad 1 el precio ya es el
 * unitario, y repetirlo es ruido. Un pack de menos de uno ("x 0,5 kg") si lo
 * muestra: el precio por kilo es el doble del del pack.
 */
export function formatUnitPrice(
  price: number,
  quantity: number,
  unit: string
): string | undefined {
  if (!Number.isFinite(price) || !Number.isFinite(quantity)) return undefined;
  if (!esPack(unit, quantity)) return undefined;

  // Redondeo al peso: los precios en pesos no se comunican con centavos.
  const unitario = Math.round(price / quantity);

  return `${formatPrice(unitario)} ${formatUnitLabel(unit, 1)}`;
}

/** Espacio que no corta renglon: "$ 139.000" nunca queda "$" arriba y el numero abajo. */
const NBSP = '\u00a0';
const sinCorte = (texto: string) => texto.replace(/ /g, NBSP);

/**
 * Texto de una pieza de peso variable para la card, corto para que entre en
 * una linea: peso aproximado y precio estimado. undefined si no es por pieza.
 * Si no entra, el unico corte posible es en " · ": "Pieza ≈ 10 kg" de un lado
 * y "$ 139.000 aprox." del otro.
 */
export function formatPieza(price: number, pesoAprox: number | null | undefined): string | undefined {
  if (typeof pesoAprox !== 'number' || pesoAprox <= 0) return undefined;
  const peso = pesoAprox.toLocaleString('es-AR', { maximumFractionDigits: 1 });
  const precio = formatPrice(Math.round(price * pesoAprox));
  return `${sinCorte(`Pieza ≈ ${peso} kg`)} · ${sinCorte(`${precio} aprox.`)}`;
}
