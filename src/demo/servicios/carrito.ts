/**
 * Portado de src/services/cart.service.ts. Mismas reglas, con el store en
 * lugar de `prisma.cartItem`. Sin `FusionNoAplicada`: en el navegador la
 * lectura previa no se cae como Neon dormida.
 */
import { leer, modificar } from '../store.ts';
import { catalogoPublicable } from './catalogo.ts';
import { aProductoCarrito } from '../../lib/catalog/carrito.ts';
import { ajustar } from '../../lib/cart/cantidades.ts';
import { fusionar, type ModoFusion } from '../../lib/cart/fusionar.ts';
import type { ItemCarrito, LineaCarrito, ProductoCarrito } from '../../lib/cart/types';
import type { EstadoDemo } from '../tipos';

/** Los productos publicados indexados por id. Una vez por operacion. */
function catalogoPorId(e: EstadoDemo): Map<string, ProductoCarrito> {
  return new Map(catalogoPublicable(e.productos).map((i) => [i.id, aProductoCarrito(i)]));
}

/**
 * Lineas con el producto resuelto; un producto que ya no esta, `producto: null`.
 * La cantidad se muestra reajustada a la regla vigente, la misma que aplica el
 * pedido; la fila no se reescribe, solo se lee.
 */
function lineasDe(e: EstadoDemo, userId: string): LineaCarrito[] {
  const catalogo = catalogoPorId(e);
  return e.carrito
    .filter((i) => i.userId === userId)
    .map((i) => {
      const producto = catalogo.get(i.productId) ?? null;
      return { productId: i.productId, quantity: producto ? ajustar(i.quantity, producto) : i.quantity, producto };
    });
}

/** Como el upsert de Prisma con `updatedAt desc`: la fila escrita pasa adelante. */
function escribirFila(e: EstadoDemo, userId: string, productId: string, quantity: number): void {
  e.carrito = [
    { userId, productId, quantity },
    ...e.carrito.filter((i) => !(i.userId === userId && i.productId === productId)),
  ];
}

/** Devuelve si habia una fila que borrar. */
function borrarFila(e: EstadoDemo, userId: string, productId: string): boolean {
  const antes = e.carrito.length;
  e.carrito = e.carrito.filter((i) => !(i.userId === userId && i.productId === productId));
  return e.carrito.length !== antes;
}

export function leerCarrito(userId: string): LineaCarrito[] {
  return lineasDe(leer(), userId);
}

/**
 * Pone una cantidad. Cero o menos quita la linea. Se ajusta al paso de la
 * unidad: el cliente puede mandar 1,3. Devuelve null si el producto no esta en
 * el catalogo o esta publicado sin precio.
 */
export function ponerEnCarrito(userId: string, productId: string, quantity: number): LineaCarrito | null {
  return modificar((e, sinCambios) => {
    const producto = catalogoPorId(e).get(productId);
    if (!producto) {
      sinCambios();
      return null;
    }

    if (quantity <= 0) {
      if (!borrarFila(e, userId, productId)) sinCambios();
      return { productId, quantity: 0, producto };
    }

    // Hoy no se da: `catalogoPublicable` ya filtra precio > 0. Se conserva por paridad con la app de origen.
    if (!producto.disponible) {
      sinCambios();
      return null;
    }

    const ajustada = ajustar(quantity, producto);
    escribirFila(e, userId, productId, ajustada);
    return { productId, quantity: ajustada, producto };
  });
}

export function quitarDelCarrito(userId: string, productId: string): void {
  modificar((e, sinCambios) => {
    if (!borrarFila(e, userId, productId)) sinCambios();
  });
}

/**
 * Fusiona el carrito local con el de la cuenta. Solo escribe las lineas que
 * cambian: recrear todo hacia desaparecer las lineas de productos que ya no se
 * publican, que tienen que seguir marcadas "ya no disponible". `modo` es
 * `maximo` en el reintento de una fusion dudosa (ver `ModoFusion`).
 */
export function fusionarCarrito(userId: string, local: ItemCarrito[], modo: ModoFusion = 'suma'): LineaCarrito[] {
  return modificar((e, sinCambios) => {
    const catalogo = catalogoPorId(e);
    const remoto = e.carrito
      .filter((i) => i.userId === userId)
      .map(({ productId, quantity }) => ({ productId, quantity }));
    const fusionado = fusionar(local, remoto, (id) => catalogo.get(id), modo);
    const remotoPorId = new Map(remoto.map((i) => [i.productId, i.quantity]));
    const cambios = fusionado.filter((i) => remotoPorId.get(i.productId) !== i.quantity);

    if (cambios.length === 0) sinCambios();
    // Al reves: la primera de `cambios` queda arriba de todo.
    for (const i of [...cambios].reverse()) escribirFila(e, userId, i.productId, i.quantity);

    return lineasDe(e, userId);
  });
}
