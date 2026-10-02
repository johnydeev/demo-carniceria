import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatearMontoEscrito, parsearMonto } from './monto.ts';

test('punto de miles y coma decimal', () => {
  assert.equal(parsearMonto('45.300'), 45300);
  assert.equal(parsearMonto('45.300,50'), 45300.5);
  assert.equal(parsearMonto('1.045.300'), 1045300);
});

test('sin separador de miles, y con coma decimal', () => {
  assert.equal(parsearMonto('45300'), 45300);
  assert.equal(parsearMonto('45,5'), 45.5);
});

test('tolera el signo pesos y los espacios', () => {
  assert.equal(parsearMonto('$ 45.300'), 45300);
  assert.equal(parsearMonto(' 45300 '), 45300);
});

test('redondea a dos decimales', () => {
  assert.equal(parsearMonto('100,456'), 100.46);
});

test('vacio, cero, negativo y letras no se leen', () => {
  assert.equal(parsearMonto(''), null);
  assert.equal(parsearMonto('0'), null);
  assert.equal(parsearMonto('0,00'), null);
  assert.equal(parsearMonto('-100'), null);
  assert.equal(parsearMonto('abc'), null);
  assert.equal(parsearMonto('45.300abc'), null);
});

test('un punto que no es de miles es ambiguo y se rechaza', () => {
  assert.equal(parsearMonto('45.5'), null);
  assert.equal(parsearMonto('45.30'), null);
  assert.equal(parsearMonto('1500.5'), null);
});

test('formatearMontoEscrito: separa los miles con punto mientras se escribe', () => {
  assert.equal(formatearMontoEscrito('80000'), '80.000');
  assert.equal(formatearMontoEscrito('100000'), '100.000');
  assert.equal(formatearMontoEscrito('15000'), '15.000');
  assert.equal(formatearMontoEscrito('1000000'), '1.000.000');
  assert.equal(formatearMontoEscrito('999'), '999');
  // Borrar un digito de "80.000" deja "80.00": se vuelve a agrupar.
  assert.equal(formatearMontoEscrito('80.00', '80.000'), '8.000');
});

test('formatearMontoEscrito: la coma es decimal, hasta dos', () => {
  assert.equal(formatearMontoEscrito('45300,'), '45.300,');
  assert.equal(formatearMontoEscrito('45300,5'), '45.300,5');
  assert.equal(formatearMontoEscrito('45300,567'), '45.300,56');
  assert.equal(formatearMontoEscrito('45,5,5'), '45,55');
  assert.equal(formatearMontoEscrito(',5'), '0,5');
});

test('formatearMontoEscrito: descarta lo que no es numero y los ceros de adelante', () => {
  assert.equal(formatearMontoEscrito(''), '');
  assert.equal(formatearMontoEscrito('abc'), '');
  assert.equal(formatearMontoEscrito('$ 80 000'), '80.000');
  assert.equal(formatearMontoEscrito('00012'), '12');
});

test('formatearMontoEscrito: un punto tipeado al final es la coma decimal (teclados que muestran "." )', () => {
  // Se tipea "." despues de "45.300": pasa a coma, no se pierde.
  assert.equal(formatearMontoEscrito('45.300.', '45.300'), '45.300,');
  assert.equal(formatearMontoEscrito('45.300,5', '45.300,'), '45.300,5');
  assert.equal(formatearMontoEscrito('.', ''), '0,');
  // Con una coma ya puesta, el punto se ignora.
  assert.equal(formatearMontoEscrito('45.300,5.', '45.300,5'), '45.300,5');
});

test('formatearMontoEscrito: pegar "45300.50" lee el punto como decimal', () => {
  assert.equal(formatearMontoEscrito('45300.50', ''), '45.300,50');
  assert.equal(formatearMontoEscrito('45300.5', ''), '45.300,5');
  // "45.300" pegado es de miles.
  assert.equal(formatearMontoEscrito('45.300', ''), '45.300');
});

test('formatearMontoEscrito: borrar sigue reagrupando', () => {
  // De "80.000" se borra un cero: "80.00" es un borrado, no un decimal.
  assert.equal(formatearMontoEscrito('80.00', '80.000'), '8.000');
});

test('lo que escribe formatearMontoEscrito lo lee parsearMonto', () => {
  for (const escrito of ['80000', '100000', '45300,5', '1234567,89']) {
    const formateado = formatearMontoEscrito(escrito);
    assert.equal(parsearMonto(formateado), Number(escrito.replace(',', '.')));
  }
});

test('el tope: menos de cien millones', () => {
  assert.equal(parsearMonto('99.999.999,99'), 99999999.99);
  assert.equal(parsearMonto('100.000.000'), null);
});
