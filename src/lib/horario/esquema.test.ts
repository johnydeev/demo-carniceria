import { test } from 'node:test';
import assert from 'node:assert/strict';
import { HorarioSchema } from './esquema.ts';
import { HORARIO_POR_DEFECTO } from './porDefecto.ts';

const conSemana = (cambios: Partial<typeof HORARIO_POR_DEFECTO.semana>) => ({
  ...HORARIO_POR_DEFECTO,
  semana: { ...HORARIO_POR_DEFECTO.semana, ...cambios },
});

const error = (dato: unknown) => {
  const r = HorarioSchema.safeParse(dato);
  return r.success ? null : r.error.issues[0].message;
};

test('el horario por defecto es valido', () => {
  assert.equal(error(HORARIO_POR_DEFECTO), null);
});

test('rechaza un cierre antes de la apertura, nombrando el dia', () => {
  assert.equal(error(conSemana({ martes: [{ abre: '13:00', cierra: '08:00' }] })), 'Martes: el cierre tiene que ser después de la apertura.');
});

test('rechaza dos turnos que se pisan', () => {
  assert.equal(
    error(conSemana({ jueves: [{ abre: '08:00', cierra: '13:00' }, { abre: '12:00', cierra: '20:00' }] })),
    'Jueves: los turnos no se pueden pisar.'
  );
});

test('rechaza tres turnos y horas mal escritas', () => {
  const t = { abre: '08:00', cierra: '09:00' };
  assert.equal(error(conSemana({ lunes: [t, { abre: '10:00', cierra: '11:00' }, { abre: '12:00', cierra: '13:00' }] })), 'Lunes: hasta dos turnos por día.');
  assert.equal(error(conSemana({ lunes: [{ abre: '8:00', cierra: '09:00' }] })), 'Lunes: hora inválida, usá HH:MM.');
  // Un campo de hora vaciado en el panel llega como ''.
  assert.equal(error(conSemana({ sabado: [{ abre: '08:15', cierra: '' }] })), 'Sábado: hora inválida, usá HH:MM.');
});

test('rechaza margenes y anticipacion fuera de rango', () => {
  assert.equal(error({ ...HORARIO_POR_DEFECTO, margenEnvioMin: 300 }), 'El margen va de 0 a 240 minutos.');
  assert.equal(error({ ...HORARIO_POR_DEFECTO, diasAnticipacion: 6 }), 'La anticipación va de 1 a 5 días.');
  assert.equal(error({ ...HORARIO_POR_DEFECTO, diasAnticipacion: 0 }), 'La anticipación va de 1 a 5 días.');
});

test('rechaza fechas cerradas invalidas', () => {
  assert.equal(error({ ...HORARIO_POR_DEFECTO, fechasCerradas: ['2026-02-30'] }), 'Fecha cerrada inválida.');
});
