import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validar } from './validar.ts';
import { FirmaSchema } from './firmaEsquema.ts';
import { CARPETA_PEDIDOS } from './orders/archivos.ts';

test('sin carpeta, o con algo que no es texto, se firma productos', () => {
  for (const body of [{}, { folder: 3 }, null, 'x', []]) {
    const r = validar(FirmaSchema, body);
    assert.equal(r.ok, true, JSON.stringify(body));
    if (r.ok) assert.deepEqual(r.datos, { folder: 'productos' });
  }
});

test('las carpetas del comercio pasan; los campos de pedido se descartan', () => {
  for (const folder of ['productos', 'elancla/banners']) {
    const r = validar(FirmaSchema, { folder, pedido: 3, tipo: 'ticket' });
    assert.equal(r.ok, true);
    if (r.ok) assert.deepEqual(r.datos, { folder });
  }
});

test('cualquier otra carpeta se rechaza, incluido el catalogo comun', () => {
  for (const folder of ['catalogo-comun', 'elancla', 'elancla/banners/../x', 'productos/', '', `${CARPETA_PEDIDOS}/otra`]) {
    const r = validar(FirmaSchema, { folder });
    assert.equal(r.ok, false, folder);
    if (!r.ok) assert.equal(r.error, 'Carpeta no permitida.');
  }
});

test('la carpeta privada exige pedido y tipo validos', () => {
  const r = validar(FirmaSchema, { folder: CARPETA_PEDIDOS, pedido: 3, tipo: 'comprobante' });
  assert.equal(r.ok, true);
  if (r.ok) assert.deepEqual(r.datos, { folder: CARPETA_PEDIDOS, pedido: 3, tipo: 'comprobante' });
  const max = validar(FirmaSchema, { folder: CARPETA_PEDIDOS, pedido: 2_147_483_647, tipo: 'ticket' });
  assert.equal(max.ok, true);
});

test('la carpeta privada sin pedido o tipo validos se rechaza', () => {
  const malos = [
    {},
    { tipo: 'ticket' },
    { pedido: 3 },
    { pedido: '3', tipo: 'ticket' },
    { pedido: 0, tipo: 'ticket' },
    { pedido: -1, tipo: 'ticket' },
    { pedido: 1.5, tipo: 'ticket' },
    { pedido: 2_147_483_648, tipo: 'ticket' },
    { pedido: 3, tipo: 'foto' },
    { pedido: 3, tipo: 'TICKET' },
  ];
  for (const extra of malos) {
    const r = validar(FirmaSchema, { folder: CARPETA_PEDIDOS, ...extra });
    assert.equal(r.ok, false, JSON.stringify(extra));
    if (!r.ok) assert.equal(r.error, 'Falta el pedido o el tipo de archivo.');
  }
});
