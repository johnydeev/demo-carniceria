import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AccionSchema } from './acciones.ts';

const error = (dato: unknown) => {
  const r = AccionSchema.safeParse(dato);
  return r.success ? null : r.error.issues[0].message;
};

test('cargarTicket: el monto llega como texto argentino y sale como numero', () => {
  const r = AccionSchema.parse({ accion: 'cargarTicket', ticketPublicId: 'elancla/pedidos/abc', montoReal: '45.300,50' });
  assert.deepEqual(r, { accion: 'cargarTicket', ticketPublicId: 'elancla/pedidos/abc', montoReal: 45300.5 });
});

test('un monto ilegible responde con el ejemplo', () => {
  assert.equal(
    error({ accion: 'cargarTicket', ticketPublicId: 'elancla/pedidos/abc', montoReal: '45.5' }),
    'Escribí el monto como 45.300 o 45.300,50'
  );
});

test('cargarTicket sin archivo', () => {
  assert.equal(error({ accion: 'cargarTicket', montoReal: '45.300' }), 'Falta cargar el ticket.');
});

test('una accion desconocida (un panel viejo mandando un estado) no pasa', () => {
  assert.equal(AccionSchema.safeParse({ status: 'confirmado' }).success, false);
  assert.equal(AccionSchema.safeParse({ accion: 'confirmar' }).success, false);
});

test('cambiarModalidad: direccion vacia es null; cancelar sin motivo es null', () => {
  assert.deepEqual(AccionSchema.parse({ accion: 'cambiarModalidad', delivery: 'retiro', address: '' }), {
    accion: 'cambiarModalidad',
    delivery: 'retiro',
    address: null,
    addressNotes: null,
  });
  assert.deepEqual(AccionSchema.parse({ accion: 'cancelar' }), { accion: 'cancelar', motivo: null });
});

test('registrarPago exige un metodo valido', () => {
  assert.equal(error({ accion: 'registrarPago', metodoPago: 'cheque' }), 'Elegí el método de pago.');
});

test('aceptar lleva la confirmacion de stock', () => {
  assert.deepEqual(AccionSchema.parse({ accion: 'aceptar', stockConfirmado: true }), {
    accion: 'aceptar',
    stockConfirmado: true,
  });
});
