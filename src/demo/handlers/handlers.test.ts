import { beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { getResponse } from 'msw';
import { handlers } from './index.ts';
import { guardarRol } from '../sesionActual.ts';
import { conProductos, instalarLocalStorage, producto } from '../pruebas/entorno.ts';

beforeEach(() => {
  instalarLocalStorage();
  conProductos([
    producto({ id: 'asado' }),
    producto({ id: 'sinPrecio', price: 0 }),
    producto({ id: 'apagado', isPublished: false }),
  ]);
});

/** El mismo mecanismo que el respaldo sin service worker de msw.ts. */
async function pedir(metodo: string, ruta: string, cuerpo?: unknown): Promise<Response> {
  const r = await getResponse(
    handlers,
    new Request(`http://localhost${ruta}`, {
      method: metodo,
      headers: cuerpo === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
    })
  );
  assert.ok(r, `sin handler para ${metodo} ${ruta}`);
  return r;
}

test('GET /api/catalog devuelve solo los publicados que se piden', async () => {
  const r = await pedir('GET', '/api/catalog?ids=asado,apagado,sinPrecio,otro');
  assert.equal(r.status, 200);
  const { productos } = await r.json();
  assert.deepEqual(productos.map((p: { id: string }) => p.id), ['asado']);
  assert.equal(productos[0].disponible, true);
});

test('GET /api/catalog sin ids devuelve la lista vacia', async () => {
  const r = await pedir('GET', '/api/catalog');
  assert.deepEqual(await r.json(), { productos: [] });
});

test('el carrito sin sesion responde 401', async () => {
  assert.equal((await pedir('GET', '/api/cart')).status, 401);
  assert.equal((await pedir('POST', '/api/cart/merge', { items: [] })).status, 401);
  assert.equal((await pedir('PUT', '/api/cart/asado', { quantity: 1 })).status, 401);
  assert.equal((await pedir('DELETE', '/api/cart/asado')).status, 401);
});

test('PUT ajusta la cantidad y GET la devuelve', async () => {
  guardarRol('cliente');
  const put = await pedir('PUT', '/api/cart/asado', { quantity: 1.3 });
  assert.equal(put.status, 200);
  assert.equal((await put.json()).linea.quantity, 1.5);
  const { lineas } = await (await pedir('GET', '/api/cart')).json();
  assert.deepEqual(lineas.map((l: { productId: string }) => l.productId), ['asado']);
});

test('PUT de un producto no disponible responde 404 con el mensaje de la ruta real', async () => {
  guardarRol('cliente');
  const r = await pedir('PUT', '/api/cart/sinPrecio', { quantity: 1 });
  assert.equal(r.status, 404);
  assert.deepEqual(await r.json(), { error: 'Producto no disponible.' });
});

test('PUT con una cantidad invalida responde 400', async () => {
  guardarRol('cliente');
  assert.equal((await pedir('PUT', '/api/cart/asado', { quantity: 'mucho' })).status, 400);
});

test('DELETE quita la linea', async () => {
  guardarRol('cliente');
  await pedir('PUT', '/api/cart/asado', { quantity: 1 });
  assert.deepEqual(await (await pedir('DELETE', '/api/cart/asado')).json(), { ok: true });
  assert.deepEqual((await (await pedir('GET', '/api/cart')).json()).lineas, []);
});

test('POST /api/cart/merge suma lo local y descarta lo no disponible', async () => {
  guardarRol('cliente');
  await pedir('PUT', '/api/cart/asado', { quantity: 1 });
  const r = await pedir('POST', '/api/cart/merge', {
    items: [
      { productId: 'asado', quantity: 1.5 },
      { productId: 'sinPrecio', quantity: 1 },
    ],
  });
  const { lineas } = await r.json();
  assert.deepEqual(
    lineas.map((l: { productId: string; quantity: number }) => [l.productId, l.quantity]),
    [['asado', 2.5]]
  );
});

test('POST /api/cart/merge con demasiados productos responde 400', async () => {
  guardarRol('cliente');
  const items = Array.from({ length: 101 }, (_, i) => ({ productId: `p${i}`, quantity: 1 }));
  const r = await pedir('POST', '/api/cart/merge', { items });
  assert.equal(r.status, 400);
  assert.deepEqual(await r.json(), { error: 'Demasiados productos.' });
});

test('POST /api/send-email: 200 con datos validos, 400 con el primer error', async () => {
  const ok = await pedir('POST', '/api/send-email', { name: 'Ana', email: 'ana@ejemplo.demo', message: 'Hola', sitio: '' });
  assert.equal(ok.status, 200);
  assert.deepEqual(await ok.json(), { message: 'Email enviado exitosamente' });

  const mal = await pedir('POST', '/api/send-email', { name: ' ', email: 'ana@ejemplo.demo', message: 'Hola' });
  assert.equal(mal.status, 400);
  assert.deepEqual(await mal.json(), { message: 'Falta el nombre.' });

  const email = await pedir('POST', '/api/send-email', { name: 'Ana', email: 'ana', message: 'Hola' });
  assert.deepEqual(await email.json(), { message: 'Email inválido.' });
});
