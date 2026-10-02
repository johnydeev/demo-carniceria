/** Origen ficticio: solo sirve para resolver la ruta y ver si se sale del sitio. */
const INTERNO = 'http://interno.invalid';

/**
 * Devuelve `pedido` si es una ruta del mismo sitio, o `porDefecto` si no.
 * Puro, con tests.
 *
 * Mirar prefijos no alcanza: el parser de URL borra tabs y saltos de linea,
 * asi que `/\t/otro.sitio` pasa un chequeo de `//` y termina siendo
 * `//otro.sitio`. Se resuelve contra un origen ficticio y se compara el
 * origen: la misma regla que aplica el navegador al navegar.
 */
export function rutaInterna(pedido: string | null | undefined, porDefecto = '/'): string {
  if (!pedido || !pedido.startsWith('/')) return porDefecto;
  try {
    const u = new URL(pedido, INTERNO);
    if (u.origin !== INTERNO) return porDefecto;
    return `${u.pathname}${u.search}${u.hash}`;
  } catch {
    return porDefecto;
  }
}
