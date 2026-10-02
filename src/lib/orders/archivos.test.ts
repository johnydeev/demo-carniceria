import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  CARPETA_PEDIDOS,
  archivosReusados,
  esArchivoDelPedido,
  formatoDeEntrega,
  idsDelBody,
  idsParaBorrar,
  nombreArchivoPedido,
  reunirEnUso,
} from './archivos.ts';

const ANTERIOR = `${CARPETA_PEDIDOS}/anterior`;
const NUEVO = `${CARPETA_PEDIDOS}/nuevo`;
const ACTUAL = `${CARPETA_PEDIDOS}/actual`;
const DE_OTRO = `${CARPETA_PEDIDOS}/de-otro`;

test('idsDelBody: solo strings no vacios, sin repetir, de cualquier body', () => {
  assert.deepEqual(idsDelBody({ accion: 'cargarTicket', ticketPublicId: NUEVO, montoReal: '1' }), [NUEVO]);
  assert.deepEqual(idsDelBody({ ticketPublicId: NUEVO, comprobantePublicId: NUEVO }), [NUEVO]);
  assert.deepEqual(idsDelBody({ ticketPublicId: '  ', comprobantePublicId: 42 }), []);
  assert.deepEqual(idsDelBody(null), []);
  assert.deepEqual(idsDelBody('texto'), []);
});

test('idsParaBorrar: solo lo que llego, fuera del pedido y sin uso en ningun pedido', () => {
  assert.deepEqual(idsParaBorrar([NUEVO], [ACTUAL, null], new Set()), [NUEVO]);
  // (b) el ticket o comprobante actual del pedido no se borra.
  assert.deepEqual(idsParaBorrar([ACTUAL], [ACTUAL, null], new Set([ACTUAL])), []);
  // (c) lo que usa otro pedido tampoco.
  assert.deepEqual(idsParaBorrar([DE_OTRO], [null, null], new Set([DE_OTRO])), []);
  // Fuera de la carpeta de pedidos (una foto de producto, un cartel): nunca.
  assert.deepEqual(idsParaBorrar(['productos/asado', 'elancla/banners/x'], [null, null], new Set()), []);
  assert.deepEqual(idsParaBorrar([NUEVO, NUEVO], [null, null], new Set()), [NUEVO]);
});

test('archivosReusados: los del body que ya usa algun pedido', () => {
  assert.deepEqual(archivosReusados([NUEVO, DE_OTRO], new Set([DE_OTRO])), [DE_OTRO]);
  assert.deepEqual(archivosReusados([NUEVO], new Set()), []);
});

test('reunirEnUso: tickets, comprobantes y tickets reemplazados, sin nulos', () => {
  const enUso = reunirEnUso(
    [
      { ticketPublicId: ACTUAL, comprobantePublicId: null },
      { ticketPublicId: null, comprobantePublicId: DE_OTRO },
    ],
    [null, ANTERIOR]
  );
  assert.deepEqual([...enUso].sort(), [ACTUAL, ANTERIOR, DE_OTRO].sort());
});

test('un ticket reemplazado (solo en archivoAnterior) no se borra ni se reusa', () => {
  // Ningun pedido lo tiene como ticket ni comprobante: solo lo nombra un evento.
  const enUso = reunirEnUso([], [ANTERIOR]);
  assert.deepEqual(idsParaBorrar([ANTERIOR], [null, null], enUso), []);
  assert.deepEqual(archivosReusados([ANTERIOR], enUso), [ANTERIOR]);
});

test('formatoDeEntrega: HEIC y HEIF se piden como JPG; el resto, tal cual', () => {
  assert.equal(formatoDeEntrega('heic'), 'jpg');
  assert.equal(formatoDeEntrega('HEIF'), 'jpg');
  assert.equal(formatoDeEntrega('pdf'), 'pdf');
  assert.equal(formatoDeEntrega('png'), 'png');
});

test('nombreArchivoPedido: pedido, tipo, fecha y hora argentinas', () => {
  // 28/9/2026 19:52:03 AR = 22:52:03 UTC.
  assert.equal(nombreArchivoPedido(3, 'ticket', new Date('2026-09-28T22:52:03Z')), 'pedido-3-ticket-20260928-195203');
  // 01:05 UTC del 1/10 = 22:05 del 30/9 en Argentina.
  assert.equal(nombreArchivoPedido(12, 'comprobante', new Date('2026-10-01T01:05:09Z')), 'pedido-12-comprobante-20260930-220509');
});

test('esArchivoDelPedido: solo el de ese pedido, ese tipo y la carpeta nueva', () => {
  const id = `${CARPETA_PEDIDOS}/pedido-3-ticket-20260928-195203`;
  assert.equal(esArchivoDelPedido(id, 3, 'ticket'), true);
  assert.equal(esArchivoDelPedido(id, 3, 'comprobante'), false);
  // El 3 no es el 30.
  assert.equal(esArchivoDelPedido(`${CARPETA_PEDIDOS}/pedido-30-ticket-20260928-195203`, 3, 'ticket'), false);
  assert.equal(esArchivoDelPedido('elancla/pedidos/pedido-3-ticket-20260928-195203', 3, 'ticket'), false);
});

test('solo se borra lo de la carpeta de tickets y comprobantes', () => {
  const nuevo = `${CARPETA_PEDIDOS}/pedido-3-ticket-20260928-195203`;
  assert.deepEqual(idsParaBorrar([nuevo], [], new Set()), [nuevo]);
  assert.deepEqual(idsParaBorrar(['elancla/pedidos/abc123'], [], new Set()), []);
  assert.deepEqual(idsParaBorrar(['catalogo-comun/asado'], [], new Set()), []);
});
