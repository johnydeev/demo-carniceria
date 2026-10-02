import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rutaInterna } from './rutaInterna.ts';

test('una ruta interna pasa con su query', () => {
  assert.equal(rutaInterna('/pedido'), '/pedido');
  assert.equal(rutaInterna('/cuenta/pedidos/12?x=1'), '/cuenta/pedidos/12?x=1');
});

test('lo que sale del sitio cae al valor por defecto', () => {
  assert.equal(rutaInterna('https://otro.sitio'), '/');
  assert.equal(rutaInterna('//otro.sitio'), '/');
  assert.equal(rutaInterna('/\\otro.sitio'), '/');
  assert.equal(rutaInterna('/\t/otro.sitio'), '/');
  assert.equal(rutaInterna('/\n/otro.sitio'), '/');
  assert.equal(rutaInterna('javascript:alert(1)'), '/');
});

test('vacio o ausente cae al valor por defecto', () => {
  assert.equal(rutaInterna(null), '/');
  assert.equal(rutaInterna(''), '/');
  assert.equal(rutaInterna(undefined, '/admin'), '/admin');
});
