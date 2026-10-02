import { test } from 'node:test';
import assert from 'node:assert/strict';
import { filterProducts, paraBuscar } from './productUtils.ts';
import type { Product } from '@/types/product';

const p = (Nombre: string, Categoría: string): Product => ({ Nombre, Categoría }) as Product;

const productos = [p('Lechon', 'Granja'), p('Vacío x pieza', 'Carniceria'), p('PICADA para 8 P', 'Fiambreria')];

test('paraBuscar: minusculas y sin tildes', () => {
  assert.equal(paraBuscar('  Carnicería '), 'carniceria');
  assert.equal(paraBuscar(null), '');
});

test('buscar lo que se ve encuentra lo guardado, con o sin tilde', () => {
  assert.deepEqual(filterProducts(productos, 'carnicería').map((x) => x.Nombre), ['Vacío x pieza']);
  assert.deepEqual(filterProducts(productos, 'fiambrería').map((x) => x.Nombre), ['PICADA para 8 P']);
  assert.deepEqual(filterProducts(productos, 'lechón').map((x) => x.Nombre), ['Lechon']);
  assert.deepEqual(filterProducts(productos, 'vacio').map((x) => x.Nombre), ['Vacío x pieza']);
});

test('sin termino devuelve todo', () => {
  assert.equal(filterProducts(productos, '   ').length, 3);
});
