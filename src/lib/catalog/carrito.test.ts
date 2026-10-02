import { test } from 'node:test';
import assert from 'node:assert/strict';
import { aProductoCarrito } from './carrito.ts';
import type { CatalogItem } from './types';

const item = (extra: Partial<CatalogItem> = {}): CatalogItem =>
  ({
    id: 'p1',
    code: '0012',
    name: 'Asado',
    price: 13900,
    category: 'Carniceria',
    imageUrl: null,
    imagePublicId: 'catalogo-comun/asado',
    stock: 0,
    description: null,
    unit: 'Kg',
    quantity: 1,
    isOffer: false,
    isPublished: true,
    pesoAprox: null,
    priceFromSheet: true,
    ...extra,
  }) as CatalogItem;

test('aProductoCarrito: disponible solo con precio mayor a cero', () => {
  assert.equal(aProductoCarrito(item()).disponible, true);
  assert.equal(aProductoCarrito(item({ price: 0 })).disponible, false);
});

test('aProductoCarrito conserva lo que deciden las reglas de cantidad y precio', () => {
  const p = aProductoCarrito(item({ quantity: 3, isOffer: true, pesoAprox: null }));
  assert.equal(p.quantity, 3);
  assert.equal(p.isOffer, true);
  assert.equal(p.pesoAprox, null);
  assert.equal(p.unit, 'Kg');
});
