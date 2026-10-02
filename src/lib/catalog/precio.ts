/**
 * Como se escribe un precio en la hoja: pesos enteros, sin separadores.
 * Puro, con tests.
 *
 * La lectura (`parsearPrecio` en merge.ts) toma el punto como separador de
 * miles, porque asi lo escribe el dueno a mano ("13.900"). Un precio con
 * centavos escrito tal cual —"1500.5"— se leia como 15005: se publicaba diez
 * veces mas caro. Los precios del comercio son enteros; se redondea al peso.
 */
export function precioParaHoja(precio: number): string {
  return String(Math.round(precio));
}
