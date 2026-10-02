import { test } from 'node:test';
import assert from 'node:assert/strict';
import { precioParaHoja } from './precio.ts';
import { parsearPrecio } from './merge.ts';

test('precioParaHoja redondea al peso y no escribe separadores', () => {
  assert.equal(precioParaHoja(1500.5), '1501');
  assert.equal(precioParaHoja(1500.4), '1500');
  assert.equal(precioParaHoja(13900), '13900');
});

test('lo que se escribe se vuelve a leer igual: no se multiplica por diez', () => {
  for (const p of [1500.5, 999.99, 13900, 0.4]) {
    assert.equal(parsearPrecio(precioParaHoja(p)), Math.round(p));
  }
});

test('parsearPrecio sigue leyendo el punto como separador de miles, como lo escribe el dueno', () => {
  assert.equal(parsearPrecio('13.900'), 13900);
  assert.equal(parsearPrecio('1.500,50'), 1500.5);
});
