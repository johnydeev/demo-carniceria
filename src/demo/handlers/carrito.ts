/**
 * Portado de src/app/api/cart/route.ts, cart/merge/route.ts y
 * cart/[productId]/route.ts: mismos esquemas, codigos y mensajes. La sesion
 * sale de `usuarioActual()` en lugar de `getServerSession`.
 */
import { http, HttpResponse } from 'msw';
import { z } from 'zod';
import { validar } from '../../lib/validar.ts';
import { usuarioActual } from '../sesionActual.ts';
import { fusionarCarrito, leerCarrito, ponerEnCarrito, quitarDelCarrito } from '../servicios/carrito.ts';

const MergeSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.coerce.number().min(0).max(1000),
      })
    )
    .max(100, { error: 'Demasiados productos.' }),
  // `maximo` lo manda el reintento de una fusion que quedo dudosa: no duplica.
  modo: z.enum(['suma', 'maximo']).optional(),
});

const CantidadSchema = z.object({
  quantity: z.coerce.number({ error: 'Cantidad inválida.' }).min(0).max(1000),
});

const noAutorizado = () => HttpResponse.json({ error: 'No autorizado' }, { status: 401 });

export const handlersCarrito = [
  http.get('*/api/cart', () => {
    const usuario = usuarioActual();
    if (!usuario) return noAutorizado();
    return HttpResponse.json({ lineas: leerCarrito(usuario.id) });
  }),

  http.post('*/api/cart/merge', async ({ request }) => {
    const usuario = usuarioActual();
    if (!usuario) return noAutorizado();

    const v = validar(MergeSchema, await request.json().catch(() => ({})));
    if (!v.ok) return HttpResponse.json({ error: v.error }, { status: 400 });

    return HttpResponse.json({ lineas: fusionarCarrito(usuario.id, v.datos.items, v.datos.modo) });
  }),

  http.put('*/api/cart/:productId', async ({ request, params }) => {
    const usuario = usuarioActual();
    if (!usuario) return noAutorizado();

    const v = validar(CantidadSchema, await request.json().catch(() => ({})));
    if (!v.ok) return HttpResponse.json({ error: v.error }, { status: 400 });

    const linea = ponerEnCarrito(usuario.id, String(params.productId), v.datos.quantity);
    if (!linea) return HttpResponse.json({ error: 'Producto no disponible.' }, { status: 404 });

    return HttpResponse.json({ linea });
  }),

  http.delete('*/api/cart/:productId', ({ params }) => {
    const usuario = usuarioActual();
    if (!usuario) return noAutorizado();

    quitarDelCarrito(usuario.id, String(params.productId));
    return HttpResponse.json({ ok: true });
  }),
];
