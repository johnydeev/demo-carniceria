import { test } from 'node:test';
import assert from 'node:assert/strict';
import { esTurnoValido, limpiarFechasPasadas, turnosDisponibles } from './turnos.ts';
import { HORARIO_POR_DEFECTO as H } from './porDefecto.ts';

const iso = (ts: { inicio: Date }[]) => ts.map((t) => t.inicio.toISOString());

test('martes 10:00: el turno en curso se ofrece y siguen los de los proximos dias', () => {
  const ts = turnosDisponibles(H, 'retiro', new Date('2026-09-29T13:00:00Z'));
  assert.equal(ts.length, 6);
  assert.equal(ts[0].inicio.toISOString(), '2026-09-29T11:15:00.000Z');
  assert.equal(ts[0].fin.toISOString(), '2026-09-29T16:00:00.000Z');
});

test('corte: retiro con 30 min se ofrece hasta las 12:30 exactas', () => {
  assert.equal(iso(turnosDisponibles(H, 'retiro', new Date('2026-09-29T15:30:00Z')))[0], '2026-09-29T11:15:00.000Z');
  assert.equal(iso(turnosDisponibles(H, 'retiro', new Date('2026-09-29T15:31:00Z')))[0], '2026-09-29T20:00:00.000Z');
  // 12:59: el primero es el de la tarde.
  assert.equal(iso(turnosDisponibles(H, 'retiro', new Date('2026-09-29T15:59:00Z')))[0], '2026-09-29T20:00:00.000Z');
});

test('envio tiene su propio margen: a las 11:45 la manana ya no va, para retiro si', () => {
  const ahora = new Date('2026-09-29T14:45:00Z');
  assert.equal(iso(turnosDisponibles(H, 'envio', ahora))[0], '2026-09-29T20:00:00.000Z');
  assert.equal(iso(turnosDisponibles(H, 'retiro', ahora))[0], '2026-09-29T11:15:00.000Z');
});

test('de noche el primero es el de manana a la manana', () => {
  const ts = turnosDisponibles(H, 'retiro', new Date('2026-09-30T00:00:00Z')); // martes 21:00 AR
  assert.equal(ts.length, 4);
  assert.equal(ts[0].inicio.toISOString(), '2026-09-30T11:15:00.000Z');
});

test('salta los dias sin turnos (lunes) y respeta la anticipacion', () => {
  const ts = turnosDisponibles(H, 'retiro', new Date('2026-10-04T17:00:00Z')); // domingo 14:00 AR
  assert.deepEqual(iso(ts), ['2026-10-06T11:15:00.000Z', '2026-10-06T20:00:00.000Z']);
  assert.equal(turnosDisponibles({ ...H, diasAnticipacion: 1 }, 'retiro', new Date('2026-09-29T13:00:00Z')).length, 2);
});

test('salta las fechas cerradas', () => {
  const ts = turnosDisponibles({ ...H, fechasCerradas: ['2026-09-30'] }, 'retiro', new Date('2026-09-30T00:00:00Z'));
  assert.deepEqual(iso(ts), ['2026-10-01T11:15:00.000Z', '2026-10-01T20:00:00.000Z']);
});

test('hoy es el dia argentino: a las 23:30 del martes (02:30 UTC del miercoles) hoy sigue siendo martes', () => {
  const ahora = new Date('2026-09-30T02:30:00Z');
  assert.deepEqual(turnosDisponibles({ ...H, diasAnticipacion: 1 }, 'retiro', ahora), []);
  assert.equal(iso(turnosDisponibles({ ...H, diasAnticipacion: 2 }, 'retiro', ahora))[0], '2026-09-30T11:15:00.000Z');
});

test('con todo cerrado no hay turnos', () => {
  const cerrado = Object.fromEntries(Object.keys(H.semana).map((d) => [d, []])) as unknown as typeof H.semana;
  assert.deepEqual(turnosDisponibles({ ...H, semana: cerrado }, 'retiro', new Date('2026-09-29T13:00:00Z')), []);
});

test('esTurnoValido: acepta uno ofrecido y rechaza inventados, vencidos y cerrados', () => {
  const ahora = new Date('2026-09-29T13:00:00Z');
  assert.equal(esTurnoValido(H, 'retiro', ahora, new Date('2026-09-29T20:00:00Z'))?.fin.toISOString(), '2026-09-29T23:45:00.000Z');
  assert.equal(esTurnoValido(H, 'retiro', ahora, new Date('2026-09-29T21:00:00Z')), null);
  assert.equal(esTurnoValido(H, 'retiro', new Date('2026-09-29T15:59:00Z'), new Date('2026-09-29T11:15:00Z')), null);
  assert.equal(
    esTurnoValido({ ...H, fechasCerradas: ['2026-09-30'] }, 'retiro', ahora, new Date('2026-09-30T11:15:00Z')),
    null
  );
});

test('limpiarFechasPasadas: saca las pasadas, repetidas y ordena', () => {
  const r = limpiarFechasPasadas({ ...H, fechasCerradas: ['2026-10-12', '2026-09-01', '2026-09-29', '2026-10-12'] }, new Date('2026-09-29T13:00:00Z'));
  assert.deepEqual(r.fechasCerradas, ['2026-09-29', '2026-10-12']);
});
