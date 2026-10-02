import { test } from 'node:test';
import assert from 'node:assert/strict';
import { anioEnArgentina, fechaHoraNumerica, inicioOFinDeDia, soloFecha } from './fechas.ts';

test('un pedido de las 20:00 en Argentina se muestra a las 20:00 y del mismo dia, este donde este el servidor', () => {
  // 20:00 del 20/09 en Argentina = 23:00 UTC.
  const iso = '2026-09-20T23:00:00.000Z';
  assert.match(fechaHoraNumerica(iso), /^20\/0?9.*20:00$/);
  // 22:30 en Argentina = 01:30 UTC del 21: sigue siendo el 20.
  assert.match(fechaHoraNumerica('2026-09-21T01:30:00.000Z'), /^20\/0?9.*22:30$/);
  assert.equal(soloFecha('2026-09-21T01:30:00.000Z'), '20/9/2026');
});

test('inicio y fin de dia en hora argentina', () => {
  assert.equal(inicioOFinDeDia('2026-09-20', false)?.toISOString(), '2026-09-20T03:00:00.000Z');
  assert.equal(inicioOFinDeDia('2026-09-20', true)?.toISOString(), '2026-09-21T02:59:59.999Z');
});

test('fechas invalidas dan null', () => {
  assert.equal(inicioOFinDeDia('', false), null);
  assert.equal(inicioOFinDeDia('20/09/2026', false), null);
  assert.equal(inicioOFinDeDia('2026-13-45', false), null);
  assert.equal(inicioOFinDeDia('2026-02-30', false), null);
});

test('el año es el de Argentina, no el de UTC', () => {
  // 21:30 del 31/12 en Argentina = 00:30 UTC del 1/1: sigue siendo 2026.
  assert.equal(anioEnArgentina(new Date('2027-01-01T00:30:00.000Z')), 2026);
  // Medianoche argentina = 03:00 UTC: recien ahi cambia.
  assert.equal(anioEnArgentina(new Date('2027-01-01T02:59:59.999Z')), 2026);
  assert.equal(anioEnArgentina(new Date('2027-01-01T03:00:00.000Z')), 2027);
});
