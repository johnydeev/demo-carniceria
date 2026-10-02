import { ajustar, type ReglaCantidad } from './cantidades.ts';
import type { ItemCarrito } from './types';

/**
 * Como se combinan las cantidades de un producto que esta de los dos lados.
 * `suma` es la primera fusion. `maximo` es el reintento de una fusion que
 * termino sin saber si se aplico (se perdio la respuesta): si se aplico, el
 * remoto ya trae la suma y el maximo la deja igual; si no, queda el mayor de
 * los dos. Pierde un poco en el peor caso, pero nunca duplica.
 */
export type ModoFusion = 'suma' | 'maximo';

/** La regla de cantidad mas si se puede pedir: publicado y con precio. */
export type ReglaFusion = ReglaCantidad & { disponible?: boolean };

/**
 * Fusiona el carrito local (sin sesion) con el de la base al loguearse.
 * Combina por producto segun el modo, ajusta al paso de la unidad y descarta
 * lo que ya no esta en el catalogo o no se puede pedir (`disponible` en
 * false: publicado sin precio, que `ponerEnCarrito` rechaza y despues frena
 * el pedido). El remoto va primero para no reordenar lo que el cliente ya
 * tenia en la cuenta; la base despues devuelve por updatedAt.
 *
 * Con `maximo` es idempotente: aplicarla dos veces con el mismo local da lo
 * mismo, porque `ajustar` es monotona e idempotente.
 */
export function fusionar(
  local: ItemCarrito[],
  remoto: ItemCarrito[],
  reglaDe: (productId: string) => ReglaFusion | undefined,
  modo: ModoFusion = 'suma'
): ItemCarrito[] {
  const combinado = new Map<string, number>();

  for (const item of remoto) {
    combinado.set(item.productId, (combinado.get(item.productId) ?? 0) + item.quantity);
  }
  for (const item of local) {
    const previo = combinado.get(item.productId);
    combinado.set(
      item.productId,
      previo === undefined ? item.quantity : modo === 'maximo' ? Math.max(previo, item.quantity) : previo + item.quantity
    );
  }

  const resultado: ItemCarrito[] = [];
  for (const [productId, quantity] of combinado) {
    const regla = reglaDe(productId);
    if (!regla || regla.disponible === false) continue;
    resultado.push({ productId, quantity: ajustar(quantity, regla) });
  }
  return resultado;
}
