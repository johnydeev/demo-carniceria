import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cantidadItem, direccionEnLinea, textoPedido, urlWhatsApp, urlWhatsAppApp, type PedidoParaMensaje } from './mensaje.ts';

const base: PedidoParaMensaje = {
  number: 123,
  items: [
    { name: 'Asado', unit: 'Kg', quantity: 1.5, isOffer: false, packQuantity: 1, unitPrice: 13900 },
    { name: 'Alitas x 3KG', unit: 'Kg', quantity: 1, isOffer: true, packQuantity: 3, unitPrice: 4500 },
  ],
  estimatedTotal: 25350,
  delivery: 'envio',
  address: 'Av. X 123',
  addressNotes: 'timbre 2',
  customerName: 'Juan Pérez',
  customerPhone: '11 1234 5678',
  notes: 'sin grasa',
};

test('envio con notas: todas las lineas', () => {
  assert.equal(
    textoPedido(base),
    [
      'Hola! Pedido #123 desde la web',
      '• Asado × 1,5 kg — $ 20.850',
      '• Alitas x 3KG × 1 (oferta) — $ 4.500',
      'Total estimado: $ 25.350 (se ajusta al pesar)',
      'Envío a domicilio: Av. X 123, timbre 2',
      'Nombre: Juan Pérez · Tel: 11 1234 5678',
      'Notas: sin grasa',
    ].join('\n')
  );
});

test('retiro sin notas ni direccion', () => {
  const t = textoPedido({ ...base, delivery: 'retiro', address: null, addressNotes: null, notes: null });
  assert.match(t, /Retiro en el local/);
  assert.doesNotMatch(t, /Notas:/);
  assert.doesNotMatch(t, /Envío/);
});

test('envio sin notas de direccion no deja coma colgando', () => {
  const t = textoPedido({ ...base, addressNotes: null });
  assert.match(t, /Envío a domicilio: Av\. X 123\n/);
});

test('cantidadItem: suelto con unidad, paquete con packs', () => {
  assert.equal(cantidadItem(base.items[0]), '1,5 kg');
  assert.equal(cantidadItem(base.items[1]), '1 (oferta)');
  assert.equal(cantidadItem({ unit: 'Unidad', isOffer: false, packQuantity: 30, quantity: 2 }), '2');
  // Pack de menos de un kilo ("x 0,5 kg"): tambien va en packs, no en kilos.
  assert.equal(cantidadItem({ unit: 'Kg', isOffer: false, packQuantity: 0.5, quantity: 1 }), '1');
  // Oferta por kilo: cantidad suelta con la marca de oferta.
  assert.equal(cantidadItem({ unit: 'Kg', isOffer: true, packQuantity: 1, quantity: 1.5 }), '1,5 kg (oferta)');
  // Pieza de peso variable: piezas y peso aproximado.
  assert.equal(
    cantidadItem({ unit: 'Kg', isOffer: false, packQuantity: 1, quantity: 2, pesoAprox: 10 }),
    '2 piezas (aprox. 10 kg)'
  );
});

test('una pieza va con su peso aproximado y el precio marcado como estimado', () => {
  const t = textoPedido({
    ...base,
    items: [
      { name: 'Asado x Plancha', unit: 'Kg', quantity: 1, isOffer: false, packQuantity: 1, unitPrice: 139000, pesoAprox: 10 },
    ],
    estimatedTotal: 139000,
  });
  assert.match(t, /• Asado x Plancha × 1 pieza \(aprox\. 10 kg\) — \$ 139\.000 estimado/);
});

test('urlWhatsApp apunta a wa.me con el texto codificado', () => {
  const u = urlWhatsApp('5491100000000', base);
  assert.ok(u.startsWith('https://wa.me/5491100000000?text='));
  assert.ok(u.includes(encodeURIComponent('Pedido #123')));
  assert.ok(!u.includes('\n'));
});

test('urlWhatsAppApp abre la app con el mismo texto que wa.me', () => {
  const app = urlWhatsAppApp('5491100000000', base);
  const web = urlWhatsApp('5491100000000', base);
  assert.ok(app.startsWith('whatsapp://send?phone=5491100000000&text='));
  assert.equal(app.split('&text=')[1], web.split('?text=')[1]);
});

test('direccionEnLinea: direccion y piso con coma; sin piso, solo la direccion', () => {
  assert.equal(direccionEnLinea('Calle falsa 123', '3 A'), 'Calle falsa 123, 3 A');
  assert.equal(direccionEnLinea('Calle falsa 123', ''), 'Calle falsa 123');
  assert.equal(direccionEnLinea('Calle falsa 123', null), 'Calle falsa 123');
  assert.equal(direccionEnLinea(' Calle falsa 123 ', '  '), 'Calle falsa 123');
  assert.equal(direccionEnLinea(null, null), '');
});

test('con turno: retiro y envio dicen cuando, con fecha absoluta', () => {
  const turno = { turnoInicio: '2026-09-30T20:00:00.000Z', turnoFin: '2026-09-30T23:45:00.000Z' };
  const retiro = textoPedido({ ...base, ...turno, delivery: 'retiro', address: null, addressNotes: null });
  assert.match(retiro, /^Retiro en el local: miércoles 30\/9 por la tarde \(17:00 a 20:45\)$/m);
  const envio = textoPedido({ ...base, ...turno });
  assert.match(envio, /^Envío a domicilio: Av\. X 123, timbre 2\nEntrega: miércoles 30\/9 por la tarde \(17:00 a 20:45\)$/m);
});

test('con metodo de pago: la linea "Pago" va antes del nombre; sin metodo, no va', () => {
  const t = textoPedido({ ...base, metodoPagoElegido: 'transferencia' });
  assert.match(t, /^Envío a domicilio: Av\. X 123, timbre 2\nPago: transferencia\nNombre: Juan Pérez/m);
  const retiro = textoPedido({ ...base, delivery: 'retiro', metodoPagoElegido: 'efectivo' });
  assert.match(retiro, /^Retiro en el local\nPago: efectivo$/m);
  assert.doesNotMatch(textoPedido({ ...base, metodoPagoElegido: null }), /Pago:/);
  assert.doesNotMatch(textoPedido(base), /Pago:/);
});
