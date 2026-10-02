import { beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { CLAVE_ROL, guardarRol, leerRol, sesionDe, usuarioActual } from './sesionActual.ts';
import { ID_CLIENTE_DEMO, ID_DUENIO_DEMO, semilla } from './semilla.ts';
import { leer, modificar } from './store.ts';
import { instalarLocalStorage, sinLocalStorage, type AlmacenFalso } from './pruebas/entorno.ts';

let ls: AlmacenFalso;
beforeEach(() => {
  ls = instalarLocalStorage();
});

const usuarios = () => semilla(new Date()).usuarios;

test('sin rol guardado se mira como visitante', () => {
  assert.equal(leerRol(), 'visitante');
});

test('el rol guardado se lee; uno invalido vuelve a visitante', () => {
  guardarRol('duenio');
  assert.equal(leerRol(), 'duenio');
  assert.equal(ls.getItem(CLAVE_ROL), 'duenio');
  ls.setItem(CLAVE_ROL, 'superadmin');
  assert.equal(leerRol(), 'visitante');
});

test('visitante no tiene sesion', () => {
  assert.equal(sesionDe('visitante', usuarios()), null);
});

test('cliente y dueño son los usuarios de la semilla, con su rol', () => {
  const cliente = sesionDe('cliente', usuarios());
  const duenio = sesionDe('duenio', usuarios());
  assert.equal(cliente?.id, ID_CLIENTE_DEMO);
  assert.equal(cliente?.role, 'user');
  assert.equal(cliente?.bloqueado, undefined);
  assert.equal(duenio?.id, ID_DUENIO_DEMO);
  assert.equal(duenio?.role, 'admin');
});

test('un cliente desactivado queda bloqueado: id vacio y rol user, como el token de la app real', () => {
  const us = usuarios().map((u) => (u.id === ID_CLIENTE_DEMO ? { ...u, isActive: false } : u));
  const s = sesionDe('cliente', us);
  assert.equal(s?.bloqueado, true);
  assert.equal(s?.id, '');
  assert.equal(s?.role, 'user');
});

test('usuarioActual: lo que usan los handlers en lugar de getServerSession', () => {
  leer();
  assert.equal(usuarioActual(), null);
  guardarRol('cliente');
  assert.deepEqual(usuarioActual(), { id: ID_CLIENTE_DEMO, role: 'user' });
  guardarRol('duenio');
  assert.deepEqual(usuarioActual(), { id: ID_DUENIO_DEMO, role: 'admin' });
});

test('usuarioActual de un cliente desactivado es null', () => {
  guardarRol('cliente');
  modificar((e) => {
    const u = e.usuarios.find((x) => x.id === ID_CLIENTE_DEMO);
    if (u) u.isActive = false;
  });
  assert.equal(usuarioActual(), null);
});

test('sin localStorage el rol vive en memoria', () => {
  sinLocalStorage();
  guardarRol('cliente');
  assert.equal(leerRol(), 'cliente');
});
