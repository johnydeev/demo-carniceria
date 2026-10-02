import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nombreTurno, nombreTurnoAbsoluto } from './nombres.ts';

const t = (inicio: string, fin: string) => ({ inicio: new Date(inicio), fin: new Date(fin) });
const MARTES_10 = new Date('2026-09-29T13:00:00Z');

test('hoy y manana, por la manana y por la tarde', () => {
  assert.equal(nombreTurno(t('2026-09-29T11:15:00Z', '2026-09-29T16:00:00Z'), MARTES_10), 'Hoy por la mañana (8:15 a 13:00)');
  assert.equal(nombreTurno(t('2026-09-30T20:00:00Z', '2026-09-30T23:45:00Z'), MARTES_10), 'Mañana por la tarde (17:00 a 20:45)');
});

test('del tercer dia en adelante, dia de la semana y fecha; de corrido, todo el dia', () => {
  assert.equal(nombreTurno(t('2026-10-01T11:15:00Z', '2026-10-01T16:00:00Z'), MARTES_10), 'Jueves 1/10 por la mañana (8:15 a 13:00)');
  assert.equal(nombreTurno(t('2026-10-02T11:15:00Z', '2026-10-02T23:45:00Z'), MARTES_10), 'Viernes 2/10 todo el día (8:15 a 20:45)');
});

test('un turno pasado dice ayer (panel: atrasados)', () => {
  assert.equal(
    nombreTurno(t('2026-09-29T11:15:00Z', '2026-09-29T16:00:00Z'), new Date('2026-09-30T13:00:00Z')),
    'Ayer por la mañana (8:15 a 13:00)'
  );
});

test('a las 23:30 del martes, el miercoles es manana, no hoy', () => {
  assert.equal(
    nombreTurno(t('2026-09-30T11:15:00Z', '2026-09-30T16:00:00Z'), new Date('2026-09-30T02:30:00Z')),
    'Mañana por la mañana (8:15 a 13:00)'
  );
});

test('absoluto: dia y fecha, sin hoy ni manana', () => {
  assert.equal(nombreTurnoAbsoluto(t('2026-09-30T20:00:00Z', '2026-09-30T23:45:00Z')), 'miércoles 30/9 por la tarde (17:00 a 20:45)');
});
