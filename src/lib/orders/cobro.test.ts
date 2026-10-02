import { test } from 'node:test';
import assert from 'node:assert/strict';
import { COBRO_POR_DEFECTO, CobroSchema } from './cobro.ts';

const error = (dato: unknown) => {
  const r = CobroSchema.safeParse(dato);
  return r.success ? null : r.error.issues[0].message;
};

test('el defecto es valido', () => {
  assert.equal(error(COBRO_POR_DEFECTO), null);
  assert.deepEqual(COBRO_POR_DEFECTO, { alias: '', titular: '', maxArchivoMB: 10 });
});

test('recorta espacios', () => {
  const r = CobroSchema.parse({ alias: '  la.esquina.demo ', titular: ' Juan Pérez ', maxArchivoMB: 5 });
  assert.deepEqual(r, { alias: 'la.esquina.demo', titular: 'Juan Pérez', maxArchivoMB: 5 });
});

test('rechaza alias y titular largos', () => {
  assert.equal(error({ ...COBRO_POR_DEFECTO, alias: 'a'.repeat(61) }), 'El alias va hasta 60 caracteres.');
  assert.equal(error({ ...COBRO_POR_DEFECTO, alias: 'a'.repeat(60) }), null);
  assert.equal(error({ ...COBRO_POR_DEFECTO, titular: 'b'.repeat(81) }), 'El titular va hasta 80 caracteres.');
});

test('maxArchivoMB entero de 1 a 10', () => {
  assert.equal(error({ ...COBRO_POR_DEFECTO, maxArchivoMB: 0 }), 'El tamaño máximo va de 1 a 10 MB.');
  assert.equal(error({ ...COBRO_POR_DEFECTO, maxArchivoMB: 11 }), 'El tamaño máximo va de 1 a 10 MB.');
  assert.equal(error({ ...COBRO_POR_DEFECTO, maxArchivoMB: 2.5 }), 'El tamaño máximo va de 1 a 10 MB.');
  assert.equal(error({ ...COBRO_POR_DEFECTO, maxArchivoMB: 1 }), null);
});
