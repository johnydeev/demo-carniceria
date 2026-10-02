/**
 * Portado de src/app/api/catalog/route.ts: resuelve productos por id para el
 * carrito de quien no tiene sesion. Solo publicados; un id que no vuelve es un
 * producto que ya no esta.
 */
import { http, HttpResponse } from 'msw';
import { leer } from '../store.ts';
import { catalogoPublicable } from '../servicios/catalogo.ts';
import { aProductoCarrito } from '../../lib/catalog/carrito.ts';

const MAXIMO_IDS = 100;

export const handlersCatalogo = [
  http.get('*/api/catalog', ({ request }) => {
    const ids = (new URL(request.url).searchParams.get('ids') ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, MAXIMO_IDS);

    if (ids.length === 0) return HttpResponse.json({ productos: [] });

    const buscados = new Set(ids);
    const productos = catalogoPublicable(leer().productos)
      .filter((i) => buscados.has(i.id))
      .map(aProductoCarrito);

    return HttpResponse.json({ productos });
  }),
];
