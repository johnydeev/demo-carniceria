import { test } from 'node:test';
import assert from 'node:assert/strict';
import { agruparPorTurno } from './agrupar.ts';
import type { EstadoPedido } from '../orders/estados';

const p = (id: string, status: EstadoPedido, turnoInicio: string | null, turnoFin: string | null) => ({
  id,
  status,
  turnoInicio,
  turnoFin,
});

test('orden de trabajo: atrasados, despues los que vienen, despues los pasados resueltos, sin turno al final', () => {
  const ahora = new Date('2026-09-29T17:00:00Z'); // martes 14:00 AR
  const grupos = agruparPorTurno(
    [
      p('a', 'pendiente', '2026-09-30T11:15:00Z', '2026-09-30T16:00:00Z'),
      p('b', 'pendiente', null, null),
      p('c', 'en_preparacion', '2026-09-29T11:15:00Z', '2026-09-29T16:00:00Z'),
      p('d', 'pendiente', '2026-09-30T11:15:00Z', '2026-09-30T16:00:00Z'),
      p('e', 'entregado', '2026-09-28T11:15:00Z', '2026-09-28T16:00:00Z'),
    ],
    ahora
  );
  assert.deepEqual(grupos.map((g) => g.pedidos.map((x) => x.id)), [['c'], ['a', 'd'], ['e'], ['b']]);
  assert.deepEqual(grupos.map((g) => g.atrasado), [true, false, false, false]);
  assert.equal(grupos[3].inicio, null);
});

test('los que vienen, del mas cercano al mas lejano; los pasados resueltos, del mas reciente al mas viejo', () => {
  const ahora = new Date('2026-09-29T17:00:00Z');
  const grupos = agruparPorTurno(
    [
      p('jue', 'pendiente', '2026-10-01T11:15:00Z', '2026-10-01T16:00:00Z'),
      p('hoyTarde', 'pendiente', '2026-09-29T20:00:00Z', '2026-09-29T23:45:00Z'),
      p('dom', 'entregado', '2026-09-27T11:15:00Z', '2026-09-27T16:00:00Z'),
      p('lun', 'cancelado', '2026-09-28T11:15:00Z', '2026-09-28T16:00:00Z'),
    ],
    ahora
  );
  assert.deepEqual(grupos.map((g) => g.pedidos[0].id), ['hoyTarde', 'jue', 'lun', 'dom']);
});

test('atrasado con los estados nuevos: en preparacion, preparado y listo cuentan; entregado y cancelado no', () => {
  const ahora = new Date('2026-09-29T17:00:00Z'); // martes 14:00 AR; el turno de la manana termino a las 13
  const inicio = '2026-09-29T11:15:00Z';
  const fin = '2026-09-29T16:00:00Z';
  for (const status of ['pendiente', 'en_preparacion', 'preparado', 'listo'] as EstadoPedido[]) {
    assert.equal(agruparPorTurno([p('x', status, inicio, fin)], ahora)[0].atrasado, true, status);
  }
  assert.equal(agruparPorTurno([p('y', 'entregado', inicio, fin), p('z', 'cancelado', inicio, fin)], ahora)[0].atrasado, false);
});
