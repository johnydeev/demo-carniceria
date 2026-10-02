/**
 * Todos los handlers de la API simulada. Cada grupo replica una ruta de
 * src/app/api de la app real (origen en SINCRONIZAR.md). Un `fetch` nuevo en
 * la app copiada sin handler hace fallar `fetchs.test.ts`.
 */
import type { RequestHandler } from 'msw';
import { handlersCatalogo } from './catalogo.ts';
import { handlersCarrito } from './carrito.ts';
import { handlersContacto } from './contacto.ts';

export const handlers: RequestHandler[] = [...handlersCatalogo, ...handlersCarrito, ...handlersContacto];
