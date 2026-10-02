/**
 * true en un celular o tablet. Puro, con tests: recibe lo que el navegador
 * expone en vez de leer `navigator`.
 *
 * El iPad con iPadOS se presenta como Mac de escritorio en el user agent; lo
 * delata tener pantalla tactil, que una Mac no tiene.
 */
export function esCelular(userAgent: string, puntosTactiles = 0): boolean {
  if (/Android|iPhone|iPad|iPod|Mobile/i.test(userAgent)) return true;
  return /Macintosh/i.test(userAgent) && puntosTactiles > 1;
}
