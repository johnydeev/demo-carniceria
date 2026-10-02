import { beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { fusionarCarrito, leerCarrito, ponerEnCarrito, quitarDelCarrito } from './carrito.ts';
import { leer, modificar, suscribir } from '../store.ts';
import { conProductos, instalarLocalStorage, producto } from '../pruebas/entorno.ts';

const U = 'u-cliente';

/** Cuenta las escrituras a `localStorage` y los avisos a suscriptores mientras corre `fn`. */
function contarEscrituras(fn: () => void): { escrituras: number; avisos: number } {
  const ls = globalThis.localStorage;
  const setItem = ls.setItem.bind(ls);
  let escrituras = 0;
  let avisos = 0;
  ls.setItem = (c: string, v: string) => {
    escrituras++;
    setItem(c, v);
  };
  const soltar = suscribir(() => avisos++);
  try {
    fn();
  } finally {
    soltar();
    ls.setItem = setItem;
  }
  return { escrituras, avisos };
}
const OTRO = 'u-otro';

beforeEach(() => {
  instalarLocalStorage();
  conProductos([
    producto({ id: 'asado' }),
    producto({ id: 'pack', quantity: 3, isOffer: true, price: 2500 }),
    producto({ id: 'lechon', pesoAprox: 8 }),
    producto({ id: 'sinPrecio', price: 0 }),
    producto({ id: 'apagado', isPublished: false }),
  ]);
});

test('poner ajusta al paso de la unidad', () => {
  assert.equal(ponerEnCarrito(U, 'asado', 1.3)?.quantity, 1.5);
  assert.equal(ponerEnCarrito(U, 'pack', 1.4)?.quantity, 1);
});

test('poner cero quita la linea', () => {
  ponerEnCarrito(U, 'asado', 1);
  assert.equal(ponerEnCarrito(U, 'asado', 0)?.quantity, 0);
  assert.deepEqual(leerCarrito(U), []);
});

test('poner un producto sin precio, apagado o inexistente devuelve null y no escribe', () => {
  leer();
  const conteo = contarEscrituras(() => {
    assert.equal(ponerEnCarrito(U, 'sinPrecio', 1), null);
    assert.equal(ponerEnCarrito(U, 'apagado', 1), null);
    assert.equal(ponerEnCarrito(U, 'nada', 1), null);
  });
  assert.deepEqual(conteo, { escrituras: 0, avisos: 0 });
  assert.deepEqual(leer().carrito, []);
});

test('lo ultimo escrito va primero, y cada usuario ve solo lo suyo', () => {
  ponerEnCarrito(U, 'asado', 1);
  ponerEnCarrito(U, 'pack', 1);
  ponerEnCarrito(OTRO, 'lechon', 1);
  assert.deepEqual(leerCarrito(U).map((l) => l.productId), ['pack', 'asado']);
  ponerEnCarrito(U, 'asado', 2);
  assert.deepEqual(leerCarrito(U).map((l) => l.productId), ['asado', 'pack']);
});

test('leer reajusta la cantidad a la regla vigente sin reescribir la fila', () => {
  modificar((e) => {
    e.carrito.push({ userId: U, productId: 'lechon', quantity: 1.5 });
  });
  assert.equal(leerCarrito(U)[0].quantity, 2);
  assert.equal(leer().carrito[0].quantity, 1.5);
});

test('una linea de un producto que ya no se publica sale sin producto', () => {
  modificar((e) => {
    e.carrito.push({ userId: U, productId: 'apagado', quantity: 1 });
  });
  assert.deepEqual(leerCarrito(U), [{ productId: 'apagado', quantity: 1, producto: null }]);
});

test('quitar borra solo esa linea', () => {
  ponerEnCarrito(U, 'asado', 1);
  ponerEnCarrito(U, 'pack', 1);
  quitarDelCarrito(U, 'asado');
  assert.deepEqual(leerCarrito(U).map((l) => l.productId), ['pack']);
});

test('quitar o poner cero una linea que no existe no escribe', () => {
  ponerEnCarrito(U, 'pack', 1);
  leer();
  const conteo = contarEscrituras(() => {
    quitarDelCarrito(U, 'asado');
    ponerEnCarrito(U, 'asado', 0);
  });
  assert.deepEqual(conteo, { escrituras: 0, avisos: 0 });
});

test('fusionar sin cambios no escribe', () => {
  ponerEnCarrito(U, 'asado', 2);
  leer();
  const conteo = contarEscrituras(() => {
    fusionarCarrito(U, [{ productId: 'asado', quantity: 1 }], 'maximo');
    fusionarCarrito(U, []);
  });
  assert.deepEqual(conteo, { escrituras: 0, avisos: 0 });
});

test('fusionar suma lo local y ajusta', () => {
  ponerEnCarrito(U, 'asado', 1);
  const lineas = fusionarCarrito(U, [{ productId: 'asado', quantity: 1.5 }]);
  assert.equal(lineas.find((l) => l.productId === 'asado')?.quantity, 2.5);
});

test('fusionar por maximo no duplica un reintento', () => {
  ponerEnCarrito(U, 'asado', 2.5);
  const lineas = fusionarCarrito(U, [{ productId: 'asado', quantity: 1.5 }], 'maximo');
  assert.equal(lineas.find((l) => l.productId === 'asado')?.quantity, 2.5);
});

test('fusionar descarta lo local no disponible y conserva la linea de la cuenta de un producto apagado', () => {
  modificar((e) => {
    e.carrito.push({ userId: U, productId: 'apagado', quantity: 1 });
  });
  const lineas = fusionarCarrito(U, [
    { productId: 'sinPrecio', quantity: 1 },
    { productId: 'asado', quantity: 1 },
  ]);
  assert.deepEqual(lineas.map((l) => l.productId).sort(), ['apagado', 'asado']);
  assert.equal(lineas.find((l) => l.productId === 'apagado')?.producto, null);
});
