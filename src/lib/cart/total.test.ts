import { test } from 'node:test';
import assert from 'node:assert/strict';
import { totalEstimado } from './total.ts';

test('suma precio por cantidad de las lineas disponibles', () => {
  const t = totalEstimado([
    { price: 13900, quantity: 1.5, disponible: true },
    { price: 4500, quantity: 2, disponible: true },
  ]);
  assert.equal(t, 29850);
});

test('una linea no disponible no suma', () => {
  const t = totalEstimado([
    { price: 13900, quantity: 1, disponible: true },
    { price: 99999, quantity: 1, disponible: false },
  ]);
  assert.equal(t, 13900);
});

test('redondea al peso', () => {
  assert.equal(totalEstimado([{ price: 1333, quantity: 0.5, disponible: true }]), 667);
});

test('vacio es cero', () => {
  assert.equal(totalEstimado([]), 0);
});

test('el total es la suma de las lineas redondeadas, como las escribe el mensaje', () => {
  const t = totalEstimado([
    { price: 6999, quantity: 1.5, disponible: true },
    { price: 6999, quantity: 1.5, disponible: true },
  ]);
  assert.equal(t, 10499 + 10499);
});
