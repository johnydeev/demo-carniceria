import { test } from 'node:test';
import assert from 'node:assert/strict';
import { horarioDe } from './horario.ts';
import { HORARIO_DEMO } from '../semilla.ts';
import { HORARIO_POR_DEFECTO } from '../../lib/horario/porDefecto.ts';
import type { HorarioConfig } from '../../lib/horario/esquema';

test('devuelve el horario guardado si valida', () => {
  assert.deepEqual(horarioDe({ horario: HORARIO_DEMO }), HORARIO_DEMO);
});

test('un horario roto cae al de por defecto, como obtenerHorario()', () => {
  const roto = { ...HORARIO_DEMO, margenRetiroMin: -5 } as HorarioConfig;
  assert.deepEqual(horarioDe({ horario: roto }), HORARIO_POR_DEFECTO);
});
