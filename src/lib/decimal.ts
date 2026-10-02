/**
 * Prisma devuelve los campos Decimal como objeto, no como número.
 *
 * Un Decimal serializado a JSON sin convertir llega al navegador como objeto y
 * rompe cualquier formateo. Convertir siempre en el borde: al leerlo de la base
 * y antes de mandarlo al cliente.
 *
 * La aritmética de dinero del lado del servidor se hace sobre el Decimal, no
 * sobre el resultado de esta función.
 */
export function toNumber(
  value: { toString(): string } | number | string | null | undefined
): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  const parsed = Number(value.toString());
  return Number.isNaN(parsed) ? 0 : parsed;
}
