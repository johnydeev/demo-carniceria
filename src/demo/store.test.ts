import { beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { avisoDemo, CLAVE_ESTADO, leer, modificar, reiniciar, suscribir } from './store.ts';
import { VERSION_DEMO } from './semilla.ts';
import { instalarLocalStorage, sinLocalStorage, type AlmacenFalso } from './pruebas/entorno.ts';

const T0 = new Date('2026-10-01T15:00:00.000Z');
const despues = (ms: number) => new Date(T0.getTime() + ms);
const HORA = 3_600_000;

let ls: AlmacenFalso;
beforeEach(() => {
  ls = instalarLocalStorage();
});

test('la primera lectura siembra y guarda, sin avisar reinicio', () => {
  const e = leer(T0);
  assert.equal(e.version, VERSION_DEMO);
  assert.equal(e.semilladoEn, T0.toISOString());
  assert.ok(ls.getItem(CLAVE_ESTADO));
  assert.equal(avisoDemo(), null);
});

test('dos lecturas sin cambios devuelven el mismo objeto', () => {
  assert.equal(leer(T0), leer(T0));
});

test('modificar guarda en localStorage y la lectura siguiente lo ve', () => {
  leer(T0);
  modificar((e) => {
    e.carrito.push({ userId: 'u', productId: 'p', quantity: 2 });
  }, T0);
  assert.deepEqual(leer(T0).carrito, [{ userId: 'u', productId: 'p', quantity: 2 }]);
  assert.match(ls.getItem(CLAVE_ESTADO) ?? '', /"productId":"p"/);
});

test('modificar devuelve lo que devuelve el cambio y deja un objeto nuevo', () => {
  const antes = leer(T0);
  const r = modificar((e) => e.productos.length, T0);
  assert.equal(r, antes.productos.length);
  assert.notEqual(leer(T0), antes);
});

test('una version distinta regenera, avisa y borra las claves de la app y los archivos', () => {
  ls.setItem(CLAVE_ESTADO, JSON.stringify({ version: VERSION_DEMO + 99, semilladoEn: T0.toISOString() }));
  ls.setItem('elancla.carrito', '{"items":[]}');
  ls.setItem('elancla.carrito.fusionDudosa', '1');
  ls.setItem('elancla.metricas.periodo', 'mes');
  ls.setItem('demo.archivo.abc', 'data:image/jpeg;base64,AAAA');
  ls.setItem('demo.rol', 'cliente');

  const e = leer(T0);

  assert.equal(e.version, VERSION_DEMO);
  assert.equal(avisoDemo(), 'regenerada');
  assert.equal(ls.getItem('elancla.carrito'), null);
  assert.equal(ls.getItem('elancla.carrito.fusionDudosa'), null);
  assert.equal(ls.getItem('elancla.metricas.periodo'), null);
  assert.equal(ls.getItem('demo.archivo.abc'), null);
  // El rol no es dato de la demo: sobrevive.
  assert.equal(ls.getItem('demo.rol'), 'cliente');
});

test('una semilla de hoy se conserva; la de ayer se regenera con la fecha nueva', () => {
  leer(T0); // 12:00 ART del 1/10
  assert.equal(leer(despues(11 * HORA)).semilladoEn, T0.toISOString()); // 23:00 ART, mismo dia
  assert.equal(avisoDemo(), null);

  const manana = despues(13 * HORA); // 01:00 ART del 2/10
  assert.equal(leer(manana).semilladoEn, manana.toISOString());
  assert.equal(avisoDemo(), 'regenerada');
});

test('vale el dia argentino: sembrada a las 23:50 ART, a las 00:10 ART del dia siguiente se regenera', () => {
  const sembrada = new Date('2026-10-02T02:50:00.000Z'); // 1/10 23:50 ART
  leer(sembrada);
  const medianoche = new Date('2026-10-02T03:10:00.000Z'); // 2/10 00:10 ART
  assert.equal(leer(medianoche).semilladoEn, medianoche.toISOString());
  assert.equal(avisoDemo(), 'regenerada');
});

test('vale el dia argentino: sembrada a las 00:05 ART, a las 23:55 ART del mismo dia sigue vigente', () => {
  const sembrada = new Date('2026-10-01T03:05:00.000Z'); // 1/10 00:05 ART
  leer(sembrada);
  const noche = new Date('2026-10-02T02:55:00.000Z'); // 1/10 23:55 ART
  assert.equal(leer(noche).semilladoEn, sembrada.toISOString());
  assert.equal(avisoDemo(), null);
});

test('una semilla con fecha futura o ilegible se regenera', () => {
  ls.setItem(CLAVE_ESTADO, JSON.stringify({ ...leer(T0), semilladoEn: despues(HORA).toISOString() }));
  assert.equal(leer(T0).semilladoEn, T0.toISOString());
  assert.equal(avisoDemo(), 'regenerada');

  ls.setItem(CLAVE_ESTADO, JSON.stringify({ ...leer(T0), semilladoEn: 'cualquiera' }));
  assert.equal(leer(T0).semilladoEn, T0.toISOString());
});

test('un estado con version y fecha pero sin las listas se regenera', () => {
  const completo = leer(T0);
  for (const campo of ['productos', 'banners', 'usuarios', 'carrito', 'pedidos', 'eventos'] as const) {
    ls.setItem(CLAVE_ESTADO, JSON.stringify({ ...completo, [campo]: null }));
    const e = leer(T0);
    assert.ok(Array.isArray(e[campo]), campo);
    assert.equal(avisoDemo(), 'regenerada');
  }
});

test('si localStorage se llena, el cambio queda en memoria y se avisa', () => {
  leer(T0);
  ls.setItem = () => {
    throw new DOMException('lleno', 'QuotaExceededError');
  };
  assert.doesNotThrow(() =>
    modificar((e) => {
      e.carrito.push({ userId: 'u', productId: 'p', quantity: 3 });
    }, T0),
  );
  assert.deepEqual(leer(T0).carrito, [{ userId: 'u', productId: 'p', quantity: 3 }]);
  assert.equal(avisoDemo(), 'sinAlmacenamiento');
});

test('modificar con sinCambios no escribe ni avisa a los suscriptores', () => {
  const antes = leer(T0);
  let escrituras = 0;
  const setItem = ls.setItem.bind(ls);
  ls.setItem = (c, v) => {
    escrituras++;
    setItem(c, v);
  };
  let avisos = 0;
  const soltar = suscribir(() => avisos++);
  const r = modificar((e, sinCambios) => {
    sinCambios();
    return e.productos.length;
  }, T0);
  soltar();
  assert.equal(r, antes.productos.length);
  assert.equal(escrituras, 0);
  assert.equal(avisos, 0);
  assert.equal(leer(T0), antes);
});

test('un JSON roto se regenera', () => {
  ls.setItem(CLAVE_ESTADO, '{roto');
  assert.equal(leer(T0).version, VERSION_DEMO);
  assert.equal(avisoDemo(), 'regenerada');
});

test('reiniciar vuelve a la semilla y borra el carrito local', () => {
  leer(T0);
  modificar((e) => {
    e.carrito.push({ userId: 'u', productId: 'p', quantity: 1 });
  }, T0);
  ls.setItem('elancla.carrito', '{"items":[{"productId":"p","quantity":1}]}');

  const e = reiniciar(despues(HORA));

  assert.deepEqual(e.carrito, []);
  assert.equal(e.semilladoEn, despues(HORA).toISOString());
  assert.equal(ls.getItem('elancla.carrito'), null);
  assert.deepEqual(leer(despues(HORA)).carrito, []);
  assert.equal(avisoDemo(), null);
});

test('sin localStorage la demo funciona en memoria y lo avisa', () => {
  sinLocalStorage();
  const e = leer(T0);
  assert.equal(e.version, VERSION_DEMO);
  modificar((x) => {
    x.carrito.push({ userId: 'u', productId: 'p', quantity: 1 });
  }, T0);
  assert.equal(leer(T0).carrito.length, 1);
  assert.equal(avisoDemo(), 'sinAlmacenamiento');
});
