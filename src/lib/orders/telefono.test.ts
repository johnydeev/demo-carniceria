import { test } from 'node:test';
import assert from 'node:assert/strict';
import { numeroWhatsApp } from './telefono.ts';

test('diez digitos: se antepone 549', () => {
  assert.equal(numeroWhatsApp('11 1234-5678'), '5491112345678');
});

test('con 0 y 15 de Buenos Aires', () => {
  assert.equal(numeroWhatsApp('011 15 1234-5678'), '5491112345678');
  assert.equal(numeroWhatsApp('11 15 1234 5678'), '5491112345678');
});

test('con 0 y 15 de un area de tres y de cuatro digitos', () => {
  assert.equal(numeroWhatsApp('0351 15 123-4567'), '5493511234567');
  assert.equal(numeroWhatsApp('02320 15 12-3456'), '5492320123456');
});

test('ya internacional, con o sin el 9', () => {
  assert.equal(numeroWhatsApp('+54 9 11 1234-5678'), '5491112345678');
  assert.equal(numeroWhatsApp('+54 11 1234-5678'), '5491112345678');
});

test('celular con 15 pero sin codigo de area: no se adivina el area', () => {
  assert.equal(numeroWhatsApp('15 1234-5678'), null);
  assert.equal(numeroWhatsApp('15-1234-5678'), null);
});

test('lo que no encaja no arma enlace', () => {
  assert.equal(numeroWhatsApp('1234'), null);
  assert.equal(numeroWhatsApp(''), null);
});
