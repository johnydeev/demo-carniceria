import { test } from 'node:test';
import assert from 'node:assert/strict';
import { siguiente, anterior } from './carousel.ts';

test('siguiente avanza y da la vuelta al final', () => {
  assert.equal(siguiente(0, 3), 1);
  assert.equal(siguiente(2, 3), 0);
});

test('anterior retrocede y da la vuelta al principio', () => {
  assert.equal(anterior(1, 3), 0);
  assert.equal(anterior(0, 3), 2);
});

test('con un solo slide siempre es el cero', () => {
  assert.equal(siguiente(0, 1), 0);
  assert.equal(anterior(0, 1), 0);
});

test('sin slides devuelve cero y no divide por cero', () => {
  assert.equal(siguiente(0, 0), 0);
  assert.equal(anterior(0, 0), 0);
});
