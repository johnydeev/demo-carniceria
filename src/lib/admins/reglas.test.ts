import { test } from 'node:test';
import assert from 'node:assert/strict';
import { esSemilla, motivoParaNoHacerAdmin, motivoParaNoQuitarAdmin, normalizarEmail, pareceEmail } from './reglas.ts';

const SEMILLA = 'Dueno@Gmail.com ';
const semilla = { email: 'dueno@gmail.com', role: 'admin' as const };
const otroAdmin = { email: 'socio@gmail.com', role: 'admin' as const };
const cliente = { email: 'cliente@gmail.com', role: 'user' as const, isActive: true };

test('normalizarEmail y esSemilla ignoran mayusculas y espacios', () => {
  assert.equal(normalizarEmail('  A@B.com '), 'a@b.com');
  assert.equal(esSemilla('DUENO@gmail.com', SEMILLA), true);
  assert.equal(esSemilla('socio@gmail.com', SEMILLA), false);
});

test('sin variable de semilla nadie es semilla ni gestiona admins', () => {
  assert.equal(esSemilla('dueno@gmail.com', ''), false);
  assert.equal(esSemilla('', undefined), false);
  assert.match(motivoParaNoHacerAdmin(semilla, cliente, undefined) ?? '', /ADMIN_SEMILLA_EMAIL/);
});

test('solo la semilla agrega admins', () => {
  assert.equal(motivoParaNoHacerAdmin(semilla, cliente, SEMILLA), null);
  assert.equal(motivoParaNoHacerAdmin(semilla, null, SEMILLA), null);
  assert.match(motivoParaNoHacerAdmin(otroAdmin, cliente, SEMILLA) ?? '', /Solo el administrador principal/);
});

test('una semilla que perdio el rol en la base no gestiona nada', () => {
  assert.notEqual(motivoParaNoHacerAdmin({ email: 'dueno@gmail.com', role: 'user' }, cliente, SEMILLA), null);
});

test('no se hace admin a una cuenta desactivada ni a quien ya lo es', () => {
  assert.match(motivoParaNoHacerAdmin(semilla, { ...cliente, isActive: false }, SEMILLA) ?? '', /desactivada/);
  assert.match(motivoParaNoHacerAdmin(semilla, { ...otroAdmin, isActive: true }, SEMILLA) ?? '', /ya es/);
});

test('solo la semilla quita admins, y a la semilla no la quita nadie', () => {
  const objetivo = { ...otroAdmin, isActive: true };
  assert.equal(motivoParaNoQuitarAdmin(semilla, objetivo, SEMILLA), null);
  assert.notEqual(motivoParaNoQuitarAdmin(otroAdmin, objetivo, SEMILLA), null);
  assert.match(motivoParaNoQuitarAdmin(semilla, { ...semilla, isActive: true }, SEMILLA) ?? '', /no se puede quitar/);
  assert.match(motivoParaNoQuitarAdmin(semilla, cliente, SEMILLA) ?? '', /no es administradora/);
});

test('pareceEmail', () => {
  assert.equal(pareceEmail('a@b.com'), true);
  assert.equal(pareceEmail('a@b'), false);
  assert.equal(pareceEmail('a b@c.com'), false);
});
