import { test } from 'node:test';
import assert from 'node:assert/strict';
import { horarioParaJsonLd, textoHorario } from './texto.ts';
import { HORARIO_POR_DEFECTO as H } from './porDefecto.ts';

test('textoHorario agrupa dias consecutivos iguales y dice cerrado', () => {
  assert.deepEqual(textoHorario(H), [
    'Lunes cerrado',
    'Martes a jueves: 8:15 a 13:00 y 17:00 a 20:45',
    'Viernes y sábado: 8:15 a 20:45',
    'Domingo: 8:15 a 13:00',
  ]);
});

test('horarioParaJsonLd: un bloque por horario, con los dias en ingles de schema.org', () => {
  assert.deepEqual(horarioParaJsonLd(H), [
    { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Tuesday', 'Wednesday', 'Thursday', 'Sunday'], opens: '08:15', closes: '13:00' },
    { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Tuesday', 'Wednesday', 'Thursday'], opens: '17:00', closes: '20:45' },
    { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Friday', 'Saturday'], opens: '08:15', closes: '20:45' },
  ]);
});
