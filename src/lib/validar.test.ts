import { test } from 'node:test';
import assert from 'node:assert/strict';
import { z } from 'zod';
import { validar } from './validar.ts';

const Schema = z.object({
  nombre: z.string().min(1, { error: 'Falta el nombre.' }),
  edad: z.number().int().min(0, { error: 'Edad inválida.' }),
});

test('validar devuelve los datos si el body es valido, y descarta campos de mas', () => {
  const r = validar(Schema, { nombre: 'Ana', edad: 30, role: 'admin' });
  assert.equal(r.ok, true);
  if (r.ok) assert.deepEqual(r.datos, { nombre: 'Ana', edad: 30 });
});

test('validar devuelve el primer mensaje de error', () => {
  const r = validar(Schema, { nombre: '', edad: -1 });
  assert.equal(r.ok, false);
  if (!r.ok) assert.equal(r.error, 'Falta el nombre.');
});

test('validar tolera un body que no es objeto', () => {
  assert.equal(validar(Schema, null).ok, false);
});
