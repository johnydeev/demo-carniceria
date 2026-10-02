import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ESTADOS,
  accionPrincipal,
  archivoDeMas,
  avisoDeDevolucion,
  accionesDesde,
  cambioDeMetodo,
  esEstado,
  estadoTras,
  requisitosPara,
  textoEstadoCliente,
  textoMetodo,
  transferenciaADevolver,
  type EstadoPedido,
  type PedidoParaAccion,
} from './estados.ts';

const pedido = (cambios: Partial<PedidoParaAccion> = {}): PedidoParaAccion => ({
  status: 'pendiente',
  delivery: 'retiro',
  metodoPagoElegido: 'transferencia',
  metodoPago: null,
  montoReal: null,
  tieneTicket: false,
  tieneComprobante: false,
  ...cambios,
});

test('ESTADOS lista los seis en orden de vida, sin confirmado', () => {
  assert.deepEqual(ESTADOS, ['pendiente', 'en_preparacion', 'preparado', 'listo', 'entregado', 'cancelado']);
  assert.equal(esEstado('confirmado'), false);
  assert.equal(esEstado('listo'), true);
});

test('la tabla de acciones: que admite cada estado', () => {
  assert.deepEqual(accionesDesde(pedido({ status: 'pendiente' })), ['aceptar', 'cambiarModalidad', 'cancelar']);
  assert.deepEqual(accionesDesde(pedido({ status: 'en_preparacion' })), ['cargarTicket', 'cambiarModalidad', 'cancelar']);
  assert.deepEqual(accionesDesde(pedido({ status: 'preparado' })), [
    'corregirTicket',
    'registrarPago',
    'cambiarModalidad',
    'cancelar',
  ]);
  assert.deepEqual(accionesDesde(pedido({ status: 'entregado' })), []);
  assert.deepEqual(accionesDesde(pedido({ status: 'cancelado' })), []);
});

test('el estado siguiente de cada accion', () => {
  assert.equal(estadoTras('aceptar', 'pendiente'), 'en_preparacion');
  assert.equal(estadoTras('cargarTicket', 'en_preparacion'), 'preparado');
  assert.equal(estadoTras('registrarPago', 'preparado'), 'listo');
  assert.equal(estadoTras('registrarEntrega', 'listo'), 'entregado');
  assert.equal(estadoTras('cancelar', 'listo'), 'cancelado');
  // Sin transicion: queda donde estaba.
  assert.equal(estadoTras('corregirTicket', 'preparado'), 'preparado');
  assert.equal(estadoTras('cambiarModalidad', 'en_preparacion'), 'en_preparacion');
});

test('una accion principal por estado', () => {
  assert.equal(accionPrincipal('pendiente'), 'aceptar');
  assert.equal(accionPrincipal('en_preparacion'), 'cargarTicket');
  assert.equal(accionPrincipal('preparado'), 'registrarPago');
  assert.equal(accionPrincipal('listo'), 'registrarEntrega');
  assert.equal(accionPrincipal('entregado'), null);
  assert.equal(accionPrincipal('cancelado'), null);
});

test('cargar ticket: sin archivo o con monto cero no procede', () => {
  const p = pedido({ status: 'en_preparacion' });
  assert.deepEqual(requisitosPara(p, 'cargarTicket', { montoReal: 45300 }), ['Falta cargar el ticket.']);
  assert.deepEqual(requisitosPara(p, 'cargarTicket', { ticket: true, montoReal: 0 }), ['Falta el monto.']);
  assert.deepEqual(requisitosPara(p, 'cargarTicket', { ticket: true, montoReal: null }), ['Falta el monto.']);
  assert.deepEqual(requisitosPara(p, 'cargarTicket', { ticket: true, montoReal: 45300 }), []);
});

test('una accion fuera de su estado dice por que', () => {
  assert.deepEqual(requisitosPara(pedido({ status: 'pendiente' }), 'cargarTicket', { ticket: true, montoReal: 100 }), [
    '"Cargar ticket" no corresponde a un pedido pendiente.',
  ]);
});

test('registrar pago: transferencia exige comprobante y tilde; efectivo, nada mas', () => {
  const p = pedido({ status: 'preparado', montoReal: 45300, tieneTicket: true });
  assert.deepEqual(requisitosPara(p, 'registrarPago', {}), ['Elegí el método de pago.']);
  assert.deepEqual(requisitosPara(p, 'registrarPago', { metodoPago: 'transferencia', verificado: true }), [
    'Falta el comprobante.',
  ]);
  assert.deepEqual(requisitosPara(p, 'registrarPago', { metodoPago: 'transferencia', comprobante: true }), [
    'Falta tildar que verificaste el ingreso del pago.',
  ]);
  assert.deepEqual(
    requisitosPara(p, 'registrarPago', { metodoPago: 'transferencia', comprobante: true, verificado: true }),
    []
  );
  // El cliente eligio transferencia y paso a efectivo: sin archivo, procede.
  assert.deepEqual(requisitosPara(p, 'registrarPago', { metodoPago: 'efectivo' }), []);
});

test('registrar entrega: efectivo sin tilde de cobro no se entrega', () => {
  const p = pedido({ status: 'listo', metodoPagoElegido: 'efectivo', metodoPago: 'efectivo', montoReal: 45300 });
  assert.deepEqual(requisitosPara(p, 'registrarEntrega', {}), ['Falta tildar que cobraste en efectivo.']);
  assert.deepEqual(requisitosPara(p, 'registrarEntrega', { cobrado: true }), []);
});

test('registrar entrega: cambiar a transferencia en la puerta exige comprobante y tilde', () => {
  const p = pedido({ status: 'listo', metodoPagoElegido: 'efectivo', metodoPago: 'efectivo', montoReal: 45300 });
  assert.deepEqual(requisitosPara(p, 'registrarEntrega', { metodoPago: 'transferencia' }), [
    'Falta el comprobante.',
    'Falta tildar que verificaste el ingreso del pago.',
  ]);
  assert.deepEqual(
    requisitosPara(p, 'registrarEntrega', { metodoPago: 'transferencia', comprobante: true, verificado: true }),
    []
  );
});

test('registrar entrega: con la transferencia ya verificada no pide nada, y no vuelve a efectivo', () => {
  const p = pedido({ status: 'listo', metodoPago: 'transferencia', montoReal: 45300, tieneComprobante: true });
  assert.deepEqual(requisitosPara(p, 'registrarEntrega', {}), []);
  assert.deepEqual(requisitosPara(p, 'registrarEntrega', { metodoPago: 'efectivo', cobrado: true }), [
    'El pago ya se registró por transferencia.',
  ]);
});

test('corregir ticket: en preparado siempre; en listo solo con efectivo', () => {
  const preparado = pedido({ status: 'preparado', montoReal: 45300, tieneTicket: true });
  assert.deepEqual(requisitosPara(preparado, 'corregirTicket', { montoReal: 45900 }), []);
  assert.deepEqual(requisitosPara(preparado, 'corregirTicket', { ticket: true }), []);
  assert.deepEqual(requisitosPara(preparado, 'corregirTicket', {}), ['Cargá un ticket nuevo o un monto nuevo.']);
  assert.deepEqual(requisitosPara(preparado, 'corregirTicket', { montoReal: 0 }), ['Falta el monto.']);

  const listoEfectivo = pedido({ status: 'listo', metodoPago: 'efectivo', montoReal: 45300, tieneTicket: true });
  assert.ok(accionesDesde(listoEfectivo).includes('corregirTicket'));
  assert.deepEqual(requisitosPara(listoEfectivo, 'corregirTicket', { montoReal: 45900 }), []);

  const listoTransferencia = pedido({ status: 'listo', metodoPago: 'transferencia', montoReal: 45300, tieneTicket: true });
  assert.ok(!accionesDesde(listoTransferencia).includes('corregirTicket'));
  assert.equal(requisitosPara(listoTransferencia, 'corregirTicket', { montoReal: 45900 }).length, 1);
});

test('cambiar modalidad: a envio exige direccion; a retiro, que no lo sea ya', () => {
  const p = pedido({ status: 'en_preparacion', delivery: 'retiro' });
  assert.deepEqual(requisitosPara(p, 'cambiarModalidad', { delivery: 'envio', address: '  ' }), [
    'Falta la dirección de envío.',
  ]);
  assert.deepEqual(requisitosPara(p, 'cambiarModalidad', { delivery: 'envio', address: 'Calle 123' }), []);
  assert.deepEqual(requisitosPara(p, 'cambiarModalidad', { delivery: 'retiro' }), ['El pedido ya es para retirar.']);
  assert.deepEqual(requisitosPara(pedido({ status: 'listo', delivery: 'envio' }), 'cambiarModalidad', { delivery: 'retiro' }), []);
  assert.equal(requisitosPara(pedido({ status: 'entregado' }), 'cambiarModalidad', { delivery: 'retiro' }).length, 1);
});

test('cancelar desde cada estado previo a entregado, y no desde entregado ni cancelado', () => {
  for (const status of ['pendiente', 'en_preparacion', 'preparado', 'listo'] as EstadoPedido[]) {
    assert.deepEqual(requisitosPara(pedido({ status }), 'cancelar', {}), [], status);
  }
  assert.equal(requisitosPara(pedido({ status: 'entregado' }), 'cancelar', {}).length, 1);
  assert.equal(requisitosPara(pedido({ status: 'cancelado' }), 'cancelar', {}).length, 1);
});

test('cambioDeMetodo: solo si los dos existen y difieren', () => {
  assert.equal(cambioDeMetodo({ metodoPagoElegido: 'transferencia', metodoPago: 'efectivo' }), true);
  assert.equal(cambioDeMetodo({ metodoPagoElegido: 'efectivo', metodoPago: 'efectivo' }), false);
  assert.equal(cambioDeMetodo({ metodoPagoElegido: 'efectivo', metodoPago: null }), false);
  assert.equal(cambioDeMetodo({ metodoPagoElegido: null, metodoPago: 'efectivo' }), false);
});

test('transferenciaADevolver: solo listo con transferencia', () => {
  assert.equal(transferenciaADevolver({ status: 'listo', metodoPago: 'transferencia' }), true);
  assert.equal(transferenciaADevolver({ status: 'listo', metodoPago: 'efectivo' }), false);
  assert.equal(transferenciaADevolver({ status: 'preparado', metodoPago: null }), false);
});

test('avisoDeDevolucion: listo con transferencia, firme; preparado con transferencia, suave; el resto, nada', () => {
  const m = '$ 45.300';
  assert.equal(
    avisoDeDevolucion({ status: 'listo', metodoPago: 'transferencia', metodoPagoElegido: 'efectivo' }, m),
    'Se registró una transferencia de $ 45.300: hay que devolverla.'
  );
  assert.equal(
    avisoDeDevolucion({ status: 'preparado', metodoPago: null, metodoPagoElegido: 'transferencia' }, m),
    'Si el cliente ya transfirió, hay que devolverle $ 45.300.'
  );
  // Preparado en efectivo, listo en efectivo y antes del ticket: sin aviso.
  assert.equal(avisoDeDevolucion({ status: 'preparado', metodoPago: null, metodoPagoElegido: 'efectivo' }, m), null);
  assert.equal(avisoDeDevolucion({ status: 'listo', metodoPago: 'efectivo', metodoPagoElegido: 'transferencia' }, m), null);
  assert.equal(
    avisoDeDevolucion({ status: 'en_preparacion', metodoPago: null, metodoPagoElegido: 'transferencia' }, m),
    null
  );
  assert.equal(avisoDeDevolucion({ status: 'pendiente', metodoPago: null, metodoPagoElegido: null }, m), null);
});

test('textoMetodo para el detalle del panel', () => {
  assert.equal(textoMetodo({ metodoPagoElegido: 'transferencia', metodoPago: 'efectivo' }), 'Eligió transferencia · cambió a efectivo');
  assert.equal(textoMetodo({ metodoPagoElegido: 'efectivo', metodoPago: 'efectivo' }), 'Pago: efectivo');
  assert.equal(textoMetodo({ metodoPagoElegido: 'efectivo', metodoPago: null }), 'Eligió efectivo');
  assert.equal(textoMetodo({ metodoPagoElegido: null, metodoPago: null }), 'Sin método elegido');
});

test('textoEstadoCliente: preparado segun el metodo, listo segun la modalidad', () => {
  const p = pedido();
  assert.equal(textoEstadoCliente(p), 'Recibido');
  assert.equal(textoEstadoCliente({ ...p, status: 'en_preparacion' }), 'En preparación');
  assert.equal(textoEstadoCliente({ ...p, status: 'preparado' }), 'Esperando el pago');
  assert.equal(textoEstadoCliente({ ...p, status: 'preparado', metodoPagoElegido: 'efectivo' }), 'Preparado');
  // El usado manda sobre el elegido.
  assert.equal(textoEstadoCliente({ ...p, status: 'preparado', metodoPago: 'efectivo' }), 'Preparado');
  assert.equal(textoEstadoCliente({ ...p, status: 'listo', delivery: 'retiro' }), 'Listo para retirar');
  assert.equal(textoEstadoCliente({ ...p, status: 'listo', delivery: 'envio' }), 'Listo para enviar');
  assert.equal(textoEstadoCliente({ ...p, status: 'entregado' }), 'Entregado');
  assert.equal(textoEstadoCliente({ ...p, status: 'cancelado' }), 'Cancelado');
});

test('un archivo que la accion o el metodo no llevan se rechaza antes que nada', () => {
  const preparado = pedido({ status: 'preparado', montoReal: 45300, tieneTicket: true });
  assert.deepEqual(requisitosPara(preparado, 'registrarPago', { metodoPago: 'efectivo', comprobante: true }), [
    'Con efectivo no hay comprobante.',
  ]);
  assert.deepEqual(requisitosPara(preparado, 'cancelar', { ticket: true }), ['Esta acción no lleva foto del ticket.']);
  assert.deepEqual(requisitosPara(preparado, 'cambiarModalidad', { delivery: 'retiro', comprobante: true }), [
    'Esta acción no lleva comprobante.',
  ]);
  // Sin metodo elegido todavia no se sabe: lo dice el requisito del metodo.
  assert.deepEqual(requisitosPara(preparado, 'registrarPago', { comprobante: true }), ['Elegí el método de pago.']);
});

test('registrar entrega con la transferencia ya verificada no acepta otro comprobante', () => {
  const p = pedido({ status: 'listo', metodoPago: 'transferencia', montoReal: 45300, tieneComprobante: true });
  assert.deepEqual(requisitosPara(p, 'registrarEntrega', { metodoPago: 'transferencia', comprobante: true, verificado: true }), [
    'La transferencia ya está verificada: no hace falta otro comprobante.',
  ]);
  const efectivo = pedido({ status: 'listo', metodoPago: 'efectivo', montoReal: 45300 });
  assert.equal(archivoDeMas(efectivo, 'registrarEntrega', { comprobante: true }), 'Con efectivo no hay comprobante.');
  assert.equal(archivoDeMas(efectivo, 'registrarEntrega', { metodoPago: 'transferencia', comprobante: true }), null);
});

test('aceptar exige confirmar el stock de todos los productos', () => {
  const p = pedido({ status: 'pendiente' });
  assert.deepEqual(requisitosPara(p, 'aceptar', {}), [
    'Confirmá que hay stock de todos los productos para continuar con la preparación.',
  ]);
  assert.deepEqual(requisitosPara(p, 'aceptar', { stock: false }), [
    'Confirmá que hay stock de todos los productos para continuar con la preparación.',
  ]);
  assert.deepEqual(requisitosPara(p, 'aceptar', { stock: true }), []);
});
