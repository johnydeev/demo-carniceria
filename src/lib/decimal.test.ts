import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toNumber } from './decimal.ts';

test('toNumber convierte lo que devuelve Prisma y nunca da NaN', () => {
  // Un Decimal de Prisma se comporta como un objeto con toString.
  assert.equal(toNumber({ toString: () => '13900.50' }), 13900.5);
  assert.equal(toNumber('24500'), 24500);
  assert.equal(toNumber(7), 7);
  assert.equal(toNumber(null), 0);
  assert.equal(toNumber(undefined), 0);
  assert.equal(toNumber('no es numero'), 0);
});
