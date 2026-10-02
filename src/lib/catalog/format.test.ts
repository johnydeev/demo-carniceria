import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatUnitLabel, formatUnitPrice } from './format.ts';

test('cantidad 1 muestra solo la unidad', () => {
  assert.equal(formatUnitLabel('Kg', 1), 'por kg');
  assert.equal(formatUnitLabel('Unidad', 1), 'por u');
});

test('cantidad mayor muestra el numero', () => {
  assert.equal(formatUnitLabel('Kg', 3), 'por 3 kg');
  assert.equal(formatUnitLabel('Caja', 2), 'por 2 cajas');
  assert.equal(formatUnitLabel('Docena', 2), 'por 2 docenas');
  assert.equal(formatUnitLabel('Unidad', 30), 'por 30 u');
});

test('divide el precio por la cantidad', () => {
  assert.equal(formatUnitPrice(4500, 3, 'Kg'), '$ 1.500 por kg');
});

test('la misma promo con otra cantidad da otro unitario', () => {
  assert.equal(formatUnitPrice(4500, 2, 'Kg'), '$ 2.250 por kg');
  assert.equal(formatUnitPrice(4500, 5, 'Kg'), '$ 900 por kg');
});

test('redondea al peso', () => {
  // 13900 / 3 = 4633,33
  assert.equal(formatUnitPrice(13900, 3, 'Kg'), '$ 4.633 por kg');
});

test('con cantidad 1 no muestra nada: el precio ya es el unitario', () => {
  assert.equal(formatUnitPrice(14999, 1, 'Kg'), undefined);
});

test('cantidad cero o negativa no divide', () => {
  assert.equal(formatUnitPrice(4500, 0, 'Kg'), undefined);
  assert.equal(formatUnitPrice(4500, -3, 'Kg'), undefined);
});

test('un pack de menos de uno muestra la cantidad y el precio por unidad', () => {
  // "Matambre x 0,5 kg" a $ 5.000 el pack: $ 10.000 el kilo.
  assert.equal(formatUnitLabel('Kg', 0.5), 'por 0,5 kg');
  assert.equal(formatUnitPrice(5000, 0.5, 'Kg'), '$ 10.000 por kg');
  assert.equal(formatUnitLabel('Kg', 0.25), 'por 0,25 kg');
  assert.equal(formatUnitPrice(3333, 0.25, 'Kg'), '$ 13.332 por kg');
});

test('cantidad cero o negativa no es pack: solo la unidad', () => {
  assert.equal(formatUnitLabel('Kg', 0), 'por kg');
  assert.equal(formatUnitLabel('Kg', -3), 'por kg');
});

test('precio no numerico no rompe', () => {
  assert.equal(formatUnitPrice(Number.NaN, 3, 'Kg'), undefined);
});

test('funciona con otras unidades', () => {
  assert.equal(formatUnitPrice(9000, 3, 'Docena'), '$ 3.000 por docena');
  assert.equal(formatUnitPrice(1000, 4, 'Caja'), '$ 250 por caja');
});
