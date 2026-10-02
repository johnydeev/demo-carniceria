import { test } from 'node:test';
import assert from 'node:assert/strict';
import { catalogoPublicable } from './catalogo.ts';
import { producto } from '../pruebas/entorno.ts';

const PRODUCTOS = [
  producto({ id: 'viejo', createdAt: '2026-09-01T00:00:00.000Z' }),
  producto({ id: 'nuevo', createdAt: '2026-09-30T00:00:00.000Z', isOffer: true }),
  producto({ id: 'pollo', category: 'Granja', createdAt: '2026-09-15T00:00:00.000Z' }),
  producto({ id: 'apagado', isPublished: false }),
  producto({ id: 'cero', price: 0 }),
];

test('publica solo lo encendido y con precio, lo mas nuevo primero', () => {
  assert.deepEqual(
    catalogoPublicable(PRODUCTOS).map((i) => i.id),
    ['nuevo', 'pollo', 'viejo']
  );
});

test('marca el precio como vigente (en la demo no hay respaldo de la hoja)', () => {
  assert.ok(catalogoPublicable(PRODUCTOS).every((i) => i.priceFromSheet));
});

test('filtra por rubro y por ofertas', () => {
  assert.deepEqual(catalogoPublicable(PRODUCTOS, { category: 'Granja' }).map((i) => i.id), ['pollo']);
  assert.deepEqual(catalogoPublicable(PRODUCTOS, { onlyOffers: true }).map((i) => i.id), ['nuevo']);
});
