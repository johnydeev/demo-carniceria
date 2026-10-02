import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nombreRubro, resolverCategoria } from './productCategories.ts';

test('acepta los cuatro rubros tal cual', () => {
  assert.equal(resolverCategoria('Carniceria'), 'Carniceria');
  assert.equal(resolverCategoria('Almacen'), 'Almacen');
});

test('entiende sinonimos de la hoja, sin distinguir mayusculas ni acentos', () => {
  assert.equal(resolverCategoria('Res'), 'Carniceria');
  assert.equal(resolverCategoria('cerdo'), 'Carniceria');
  assert.equal(resolverCategoria('VACUNO'), 'Carniceria');
  assert.equal(resolverCategoria('Achuras'), 'Carniceria');
  assert.equal(resolverCategoria('Pollo'), 'Granja');
  assert.equal(resolverCategoria('Huevos'), 'Granja');
  assert.equal(resolverCategoria('Fiambrería'), 'Fiambreria');
  assert.equal(resolverCategoria('almacén'), 'Almacen');
  assert.equal(resolverCategoria('  carnicería '), 'Carniceria');
});

test('un rubro desconocido devuelve null', () => {
  assert.equal(resolverCategoria('Verduleria'), null);
  assert.equal(resolverCategoria(''), null);
});

test('nombreRubro muestra el rubro con tildes', () => {
  assert.equal(nombreRubro('Carniceria'), 'Carnicería');
  assert.equal(nombreRubro('Fiambreria'), 'Fiambrería');
  assert.equal(nombreRubro('Almacen'), 'Almacén');
  assert.equal(nombreRubro('Granja'), 'Granja');
  assert.equal(nombreRubro(null), null);
});
