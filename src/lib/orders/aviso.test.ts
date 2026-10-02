import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mensajeAviso, urlAviso, type PedidoParaAviso } from './aviso.ts';

const DATOS = { alias: 'la.esquina.demo', titular: 'Juan Pérez', direccionLocal: 'Av. Siempre Viva 742, Villa Ejemplo' };
// Miercoles 30/9/2026 de 17:00 a 20:45 hora argentina.
const TURNO = { turnoInicio: '2026-09-30T20:00:00.000Z', turnoFin: '2026-09-30T23:45:00.000Z' };

const pedido = (cambios: Partial<PedidoParaAviso> = {}): PedidoParaAviso => ({
  number: 123,
  status: 'preparado',
  delivery: 'retiro',
  customerName: 'María González',
  montoReal: 45300,
  metodoPago: null,
  metodoPagoElegido: 'transferencia',
  ...TURNO,
  ...cambios,
});

test('preparado + transferencia: total, alias y titular', () => {
  assert.equal(
    mensajeAviso(pedido(), DATOS),
    'Hola María! Tu pedido #123 ya está armado. El total es $ 45.300. Podés transferir a la.esquina.demo (Juan Pérez) y mandarnos el comprobante por acá.'
  );
});

test('preparado + transferencia sin alias cargado: los datos van por el chat', () => {
  assert.equal(
    mensajeAviso(pedido(), { ...DATOS, alias: '', titular: '' }),
    'Hola María! Tu pedido #123 ya está armado. El total es $ 45.300. Te pasamos los datos para transferir por acá.'
  );
  // Alias sin titular: sin parentesis vacio.
  assert.match(mensajeAviso(pedido(), { ...DATOS, titular: ' ' }) ?? '', /transferir a la\.esquina\.demo y mandarnos/);
});

test('preparado + efectivo: se paga al retirar o al recibir', () => {
  assert.equal(
    mensajeAviso(pedido({ metodoPagoElegido: 'efectivo', montoReal: 45300.5 }), DATOS),
    'Hola María! Tu pedido #123 ya está armado. El total es $ 45.300,5. Lo pagás al retirar.'
  );
  assert.match(mensajeAviso(pedido({ metodoPagoElegido: 'efectivo', delivery: 'envio' }), DATOS) ?? '', /Lo pagás al recibir\.$/);
  // El metodo usado manda sobre el elegido.
  assert.match(mensajeAviso(pedido({ metodoPago: 'efectivo' }), DATOS) ?? '', /Lo pagás al retirar\.$/);
});

test('listo + retiro: direccion del local y turno', () => {
  assert.equal(
    mensajeAviso(pedido({ status: 'listo', metodoPago: 'efectivo' }), DATOS),
    'Hola María! Tu pedido #123 está listo para retirar en Av. Siempre Viva 742, Villa Ejemplo, el miércoles 30/9 por la tarde (17:00 a 20:45).'
  );
});

test('listo + envio: sale en el turno', () => {
  assert.equal(
    mensajeAviso(pedido({ status: 'listo', delivery: 'envio', metodoPago: 'transferencia' }), DATOS),
    'Hola María! Tu pedido #123 sale para tu domicilio el miércoles 30/9 por la tarde (17:00 a 20:45).'
  );
});

test('sin turno (pedidos anteriores al horario): sin la parte del turno', () => {
  const sinTurno = { turnoInicio: null, turnoFin: null };
  assert.equal(
    mensajeAviso(pedido({ status: 'listo', ...sinTurno }), DATOS),
    'Hola María! Tu pedido #123 está listo para retirar en Av. Siempre Viva 742, Villa Ejemplo.'
  );
  assert.equal(
    mensajeAviso(pedido({ status: 'listo', delivery: 'envio', ...sinTurno }), DATOS),
    'Hola María! Tu pedido #123 sale para tu domicilio.'
  );
});

test('sin aviso fuera de preparado y listo, o sin monto real', () => {
  assert.equal(mensajeAviso(pedido({ status: 'pendiente' }), DATOS), null);
  assert.equal(mensajeAviso(pedido({ status: 'entregado' }), DATOS), null);
  assert.equal(mensajeAviso(pedido({ montoReal: null }), DATOS), null);
});

test('urlAviso codifica el texto para wa.me', () => {
  const u = urlAviso('5491100000000', 'Hola María! Tu pedido #123');
  assert.equal(u, 'https://wa.me/5491100000000?text=Hola%20Mar%C3%ADa!%20Tu%20pedido%20%23123');
});

test('en preparacion: segun el metodo, que le mandamos el ticket o el monto', () => {
  const en = (cambios: Partial<PedidoParaAviso>) => mensajeAviso(pedido({ status: 'en_preparacion', montoReal: null, ...cambios }), DATOS);
  assert.equal(
    en({ delivery: 'envio', metodoPagoElegido: 'transferencia' }),
    'Hola María! Tu pedido #123 está en preparación. En breve te enviamos el ticket con el monto para hacer la transferencia.'
  );
  assert.equal(
    en({ delivery: 'retiro', metodoPagoElegido: 'efectivo' }),
    'Hola María! Tu pedido #123 está en preparación. En breve te enviamos el monto a pagar en el local.'
  );
  assert.equal(
    en({ delivery: 'envio', metodoPagoElegido: 'efectivo' }),
    'Hola María! Tu pedido #123 está en preparación. En breve te enviamos el monto a pagar al recibirlo.'
  );
  // Pedidos anteriores al cobro (sin metodo): se decide por la modalidad.
  assert.equal(
    en({ delivery: 'envio', metodoPagoElegido: null }),
    'Hola María! Tu pedido #123 está en preparación. En breve te enviamos el ticket con el monto para hacer la transferencia.'
  );
  assert.equal(
    en({ delivery: 'retiro', metodoPagoElegido: null }),
    'Hola María! Tu pedido #123 está en preparación. En breve te enviamos el monto a pagar en el local.'
  );
});
