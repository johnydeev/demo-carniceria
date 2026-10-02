import { test } from 'node:test';
import assert from 'node:assert/strict';
import { semilla, ID_CLIENTE_DEMO, ID_DUENIO_DEMO, EMAIL_SEMILLA_DEMO, VERSION_DEMO } from './semilla.ts';
import { HorarioSchema } from '../lib/horario/esquema.ts';
import { CobroSchema } from '../lib/orders/cobro.ts';
import { isValidProductCategory } from '../lib/productCategories.ts';
import { numeroWhatsApp } from '../lib/orders/telefono.ts';
import { esPaquete, esPieza } from '../lib/cart/cantidades.ts';

const AHORA = new Date('2026-10-01T15:00:00.000Z');

test('es deterministica: la misma fecha da los mismos datos', () => {
  assert.deepEqual(semilla(AHORA), semilla(AHORA));
});

test('marca la version y la fecha de la semilla, sin carrito ni pedidos', () => {
  const e = semilla(AHORA);
  assert.equal(e.version, VERSION_DEMO);
  assert.equal(e.semilladoEn, AHORA.toISOString());
  assert.deepEqual(e.carrito, []);
  assert.deepEqual(e.pedidos, []);
  assert.deepEqual(e.eventos, []);
  assert.equal(e.siguienteNumeroPedido, 1);
});

test('productos: unos 25-30, ids y codigos unicos, rubros validos, publicados y con precio', () => {
  const ps = semilla(AHORA).productos;
  assert.ok(ps.length >= 25 && ps.length <= 30, `hay ${ps.length}`);
  assert.equal(new Set(ps.map((p) => p.id)).size, ps.length);
  assert.equal(new Set(ps.map((p) => p.code)).size, ps.length);
  for (const p of ps) {
    assert.ok(isValidProductCategory(p.category), p.name);
    assert.ok(p.price > 0 && Number.isInteger(p.price), p.name);
    assert.equal(p.isPublished, true, p.name);
  }
});

test('trae los casos de venta del spec: oferta, pack por kilo, pieza, caja y sin foto', () => {
  const ps = semilla(AHORA).productos;
  assert.ok(ps.some((p) => p.isOffer));
  assert.ok(ps.some((p) => p.name === 'Pata y muslo x 3 kg' && esPaquete(p) && p.unit === 'Kg'));
  assert.ok(ps.some((p) => p.name.startsWith('Lechón') && esPieza(p)));
  assert.ok(ps.some((p) => p.name.includes('por caja') && esPaquete(p)));
  const sinFoto = ps.filter((p) => p.imageUrl === null);
  assert.ok(sinFoto.length >= 3);
  assert.ok(sinFoto.every((p) => p.category === 'Fiambreria' || p.category === 'Almacen'));
  // Regla de la app: peso aproximado solo con unidad Kg y cantidad 1.
  for (const p of ps.filter((x) => x.pesoAprox !== null)) {
    assert.equal(p.unit, 'Kg', p.name);
    assert.equal(p.quantity, 1, p.name);
  }
});

test('las fotos son rutas locales de la version de 720', () => {
  for (const p of semilla(AHORA).productos.filter((x) => x.imageUrl)) {
    assert.ok(p.imageUrl?.startsWith('/demo/productos/') && p.imageUrl.endsWith('-720.webp'), p.name);
    assert.equal(p.imagePublicId, null, p.name);
  }
});

test('el horario y el cobro pasan los esquemas de la app', () => {
  const e = semilla(AHORA);
  assert.ok(HorarioSchema.safeParse(e.horario).success);
  assert.deepEqual(e.horario.semana.lunes, []);
  assert.equal(e.horario.margenRetiroMin, 30);
  assert.equal(e.horario.margenEnvioMin, 90);
  assert.equal(e.horario.diasAnticipacion, 3);
  assert.ok(CobroSchema.safeParse(e.cobro).success);
  assert.equal(e.cobro.alias, 'la.esquina.demo');
  assert.equal(e.cobro.titular, 'Carnicería La Esquina');
});

test('usuarios: el dueño es admin y semilla, el cliente demo existe y esta activo', () => {
  const us = semilla(AHORA).usuarios;
  const duenio = us.find((u) => u.id === ID_DUENIO_DEMO);
  const cliente = us.find((u) => u.id === ID_CLIENTE_DEMO);
  assert.equal(duenio?.role, 'admin');
  assert.equal(duenio?.email, EMAIL_SEMILLA_DEMO);
  assert.equal(cliente?.role, 'user');
  assert.equal(cliente?.isActive, true);
  assert.ok(us.filter((u) => u.role === 'admin').length >= 2);
  assert.ok(us.filter((u) => u.role === 'user').length >= 15);
  assert.ok(us.some((u) => !u.isActive), 'falta un cliente desactivado');
  assert.equal(new Set(us.map((u) => u.email)).size, us.length);
});

test('todos los telefonos sirven para el enlace de WhatsApp del panel', () => {
  for (const u of semilla(AHORA).usuarios) {
    assert.ok(u.phone && numeroWhatsApp(u.phone), `${u.name}: ${u.phone}`);
  }
});

test('las altas de clientes se reparten en los dos meses anteriores', () => {
  const dias = semilla(AHORA)
    .usuarios.filter((u) => u.role === 'user')
    .map((u) => (AHORA.getTime() - new Date(u.createdAt).getTime()) / 86_400_000);
  assert.ok(Math.max(...dias) <= 60 && Math.max(...dias) >= 55);
  assert.ok(Math.min(...dias) >= 0 && Math.min(...dias) <= 5);
});

test('carteles: dos o tres, activos, en elancla/banners, con imagen local', () => {
  const bs = semilla(AHORA).banners;
  assert.ok(bs.length >= 2 && bs.length <= 3);
  bs.forEach((b, i) => {
    assert.equal(b.order, i);
    assert.equal(b.isActive, true);
    assert.ok(b.imagePublicId.startsWith('elancla/banners/'));
    assert.ok(b.imageUrl.startsWith('/demo/carteles/') && b.imageUrl.endsWith('.webp'));
  });
});
