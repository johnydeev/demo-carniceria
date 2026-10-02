import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bannersVigentes, validarDimensiones, parsearFecha, enlaceCartel, esEnlaceExterno, errorDeFechas, ERROR_FECHAS, BANNER_ANCHO, BANNER_ALTO } from './banners.ts';

const ahora = new Date('2026-09-20T12:00:00Z');
const ayer = new Date('2026-09-19T12:00:00Z');
const manana = new Date('2026-09-21T12:00:00Z');

function banner(extra: Partial<{ isActive: boolean; order: number; startsAt: Date | null; endsAt: Date | null }>) {
  return { isActive: true, order: 0, startsAt: null, endsAt: null, ...extra };
}

test('un banner activo sin fechas esta vigente', () => {
  assert.equal(bannersVigentes([banner({})], ahora).length, 1);
});

test('un banner inactivo no esta vigente aunque tenga fechas validas', () => {
  assert.equal(bannersVigentes([banner({ isActive: false })], ahora).length, 0);
});

test('startsAt en el futuro lo deja afuera; en el pasado lo deja entrar', () => {
  assert.equal(bannersVigentes([banner({ startsAt: manana })], ahora).length, 0);
  assert.equal(bannersVigentes([banner({ startsAt: ayer })], ahora).length, 1);
});

test('endsAt en el pasado lo deja afuera; en el futuro lo deja entrar', () => {
  assert.equal(bannersVigentes([banner({ endsAt: ayer })], ahora).length, 0);
  assert.equal(bannersVigentes([banner({ endsAt: manana })], ahora).length, 1);
});

test('el momento exacto de inicio o fin cuenta como vigente', () => {
  assert.equal(bannersVigentes([banner({ startsAt: ahora })], ahora).length, 1);
  assert.equal(bannersVigentes([banner({ endsAt: ahora })], ahora).length, 1);
});

test('devuelve ordenados por order, no por el orden de entrada', () => {
  const r = bannersVigentes([banner({ order: 2 }), banner({ order: 0 }), banner({ order: 1 })], ahora);
  assert.deepEqual(r.map((b) => b.order), [0, 1, 2]);
});

test('lista vacia da lista vacia', () => {
  assert.deepEqual(bannersVigentes([], ahora), []);
});

test('las medidas exactas no dan error', () => {
  assert.equal(validarDimensiones(1200, 500), null);
  assert.equal(BANNER_ANCHO, 1200);
  assert.equal(BANNER_ALTO, 500);
});

test('cualquier otra medida da un mensaje con las medidas reales', () => {
  assert.match(validarDimensiones(1600, 900) ?? '', /1600×900/);
  assert.match(validarDimensiones(1600, 900) ?? '', /1200×500/);
  assert.notEqual(validarDimensiones(1200, 501), null);
  assert.notEqual(validarDimensiones(1199, 500), null);
  assert.notEqual(validarDimensiones(0, 0), null);
});

test('parsearFecha: inicio de dia o fin de dia segun el flag', () => {
  // En hora argentina (UTC-3), este donde este el servidor.
  assert.equal(parsearFecha('2026-09-20', false)?.toISOString(), '2026-09-20T03:00:00.000Z');
  assert.equal(parsearFecha('2026-09-20', true)?.toISOString(), '2026-09-21T02:59:59.999Z');
});

test('parsearFecha: vacio, basura o formato distinto dan null', () => {
  assert.equal(parsearFecha('', false), null);
  assert.equal(parsearFecha(undefined, false), null);
  assert.equal(parsearFecha('20/09/2026', false), null);
  assert.equal(parsearFecha('2026-13-45', false), null);
});

test('enlaceCartel: rutas del sitio y https; nada de javascript, data ni //', () => {
  assert.equal(enlaceCartel('/productos/carniceria'), '/productos/carniceria');
  assert.equal(enlaceCartel('https://wa.me/549111'), 'https://wa.me/549111');
  assert.equal(enlaceCartel(''), null);
  assert.equal(enlaceCartel(undefined), null);
  assert.equal(enlaceCartel('javascript:alert(1)'), false);
  assert.equal(enlaceCartel('data:text/html,x'), false);
  assert.equal(enlaceCartel('//otro.sitio'), false);
  assert.equal(enlaceCartel('http://inseguro.com'), false);
});

test('esEnlaceExterno: otro sitio abre en pestana nueva; el propio y las rutas, no', () => {
  const dominio = 'https://www.laesquina.demo';
  assert.equal(esEnlaceExterno('https://www.instagram.com/p/abc/', dominio), true);
  assert.equal(esEnlaceExterno('https://wa.me/549111', dominio), true);
  assert.equal(esEnlaceExterno('/productos/carniceria', dominio), false);
  assert.equal(esEnlaceExterno('https://www.laesquina.demo/productos', dominio), false);
  // El apex redirige al www: tambien es el sitio.
  assert.equal(esEnlaceExterno('https://laesquina.demo/productos', dominio), false);
});

test('errorDeFechas: "Hasta" antes de "Desde" da el mensaje; sin una de las dos o en orden, null', () => {
  assert.equal(errorDeFechas(manana, ayer), ERROR_FECHAS);
  assert.equal(errorDeFechas(ayer, manana), null);
  assert.equal(errorDeFechas(null, ayer), null);
  assert.equal(errorDeFechas(manana, null), null);
  // El mismo dia: inicio y fin del dia en hora argentina.
  assert.equal(errorDeFechas(parsearFecha('2026-10-05', false), parsearFecha('2026-10-05', true)), null);
});
