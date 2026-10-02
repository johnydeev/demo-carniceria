import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  inicioDeDia,
  inicioDeLaSerie,
  inicioDeMes,
  inicioDeSemana,
  montoDelPedido,
  resumir,
  type PedidoMetrica,
} from './metricas.ts';

// El 2026-09-27 es domingo. Argentina es UTC-3 fijo.

test('inicioDeSemana: lunes 00:00 hora argentina', () => {
  // Domingo 27/9 12:00 AR -> la semana arranco el lunes 21/9 00:00 AR = 03:00 UTC.
  assert.equal(inicioDeSemana(new Date('2026-09-27T15:00:00Z')).toISOString(), '2026-09-21T03:00:00.000Z');
  // Domingo 27/9 23:30 AR = lunes 28/9 02:30 UTC: sigue siendo la semana del 21.
  assert.equal(inicioDeSemana(new Date('2026-09-28T02:30:00Z')).toISOString(), '2026-09-21T03:00:00.000Z');
  // Lunes 28/9 00:05 AR = 03:05 UTC: semana nueva.
  assert.equal(inicioDeSemana(new Date('2026-09-28T03:05:00Z')).toISOString(), '2026-09-28T03:00:00.000Z');
});

test('inicioDeMes: dia 1 00:00 hora argentina', () => {
  // 31/8 22:00 AR = 1/9 01:00 UTC: todavia es agosto.
  assert.equal(inicioDeMes(new Date('2026-09-01T01:00:00Z')).toISOString(), '2026-08-01T03:00:00.000Z');
  assert.equal(inicioDeMes(new Date('2026-09-10T15:00:00Z')).toISOString(), '2026-09-01T03:00:00.000Z');
});

const pedido = (
  iso: string,
  estado: PedidoMetrica['estado'],
  montoCentavos: number,
  montoEsEstimado = false
): PedidoMetrica => ({
  fecha: new Date(iso),
  estado,
  montoCentavos,
  montoEsEstimado,
});

const base = { clientes: [], clientesTotal: 0 };

test('un pedido del domingo 23:30 cuenta en esa semana; el del lunes 00:05, en la nueva', () => {
  const ahora = new Date('2026-09-28T12:00:00Z'); // lunes 09:00 AR
  const r = resumir({
    ...base,
    ahora,
    pedidos: [pedido('2026-09-28T02:30:00Z', 'entregado', 1000), pedido('2026-09-28T03:05:00Z', 'entregado', 2000)],
  });
  assert.equal(r.semana.anterior.ventasCentavos, 1000);
  assert.equal(r.semana.actual.ventasCentavos, 2000);
});

test('un pedido del ultimo dia del mes a las 22:00 cuenta en ese mes', () => {
  const ahora = new Date('2026-09-10T15:00:00Z');
  const r = resumir({ ...base, ahora, pedidos: [pedido('2026-09-01T01:00:00Z', 'entregado', 500)] });
  assert.equal(r.mes.anterior.ventasCentavos, 500);
  assert.equal(r.mes.actual.ventasCentavos, 0);
});

test('solo los entregados suman; los cancelados se cuentan aparte', () => {
  const ahora = new Date('2026-09-10T15:00:00Z');
  const dia = '2026-09-05T15:00:00Z';
  const r = resumir({
    ...base,
    ahora,
    pedidos: [
      pedido(dia, 'pendiente', 1000),
      pedido(dia, 'en_preparacion', 2000),
      pedido(dia, 'entregado', 5000),
      pedido(dia, 'cancelado', 7000),
    ],
  });
  assert.equal(r.mes.actual.pedidos, 3);
  assert.deepEqual(r.mes.actual.porEstado, {
    pendiente: 1,
    en_preparacion: 1,
    preparado: 0,
    listo: 0,
    entregado: 1,
    cancelado: 1,
  });
  assert.equal(r.mes.actual.ventasCentavos, 5000);
  assert.equal(r.mes.actual.entregados, 1);
});

test('ticket promedio: redondeado al centavo, y null sin entregados', () => {
  const ahora = new Date('2026-09-10T15:00:00Z');
  const dia = '2026-09-05T15:00:00Z';
  const r = resumir({ ...base, ahora, pedidos: [pedido(dia, 'entregado', 1000), pedido(dia, 'entregado', 2001)] });
  assert.equal(r.mes.actual.ventasCentavos, 3001);
  assert.equal(r.mes.actual.ticketCentavos, 1501);
  assert.equal(r.mes.anterior.ticketCentavos, null);
});

test('la serie tiene doce, la ultima en curso, y los periodos vacios en cero', () => {
  const ahora = new Date('2026-09-10T15:00:00Z');
  const r = resumir({ ...base, ahora, pedidos: [pedido('2026-07-15T15:00:00Z', 'entregado', 500)] });
  const s = r.mes.serie;
  assert.equal(s.length, 12);
  assert.deepEqual(s.map((p) => p.enCurso), [...Array(11).fill(false), true]);
  assert.equal(s[9].rotulo, 'jul');
  assert.equal(s[9].ventasCentavos, 500);
  assert.equal(s[10].ventasCentavos, 0);
  assert.equal(s[11].rotulo, 'sep');
});

test('cambio de anio: la serie de enero trae los meses del anio anterior', () => {
  const r = resumir({ ...base, ahora: new Date('2026-01-15T15:00:00Z'), pedidos: [] });
  assert.equal(r.mes.serie[0].inicio, '2025-02-01T03:00:00.000Z');
  assert.deepEqual(
    r.mes.serie.map((p) => p.rotulo),
    ['feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic', 'ene']
  );
  // Viernes 2/1/2026: la semana arranco el lunes 29/12/2025.
  const semanal = resumir({ ...base, ahora: new Date('2026-01-02T15:00:00Z'), pedidos: [] }).semana.serie;
  assert.equal(semanal[11].rotulo, '29/12');
  assert.equal(semanal[10].rotulo, '22/12');
});

test('clientes nuevos por periodo y total', () => {
  const ahora = new Date('2026-09-10T15:00:00Z'); // jueves; la semana arranco el lunes 7/9
  const r = resumir({
    ahora,
    pedidos: [],
    clientesTotal: 40,
    clientes: [{ alta: new Date('2026-09-05T15:00:00Z') }, { alta: new Date('2026-08-20T15:00:00Z') }],
  });
  assert.equal(r.clientesTotal, 40);
  assert.equal(r.mes.actual.clientesNuevos, 1);
  assert.equal(r.mes.anterior.clientesNuevos, 1);
  assert.equal(r.semana.actual.clientesNuevos, 0);
  assert.equal(r.semana.anterior.clientesNuevos, 1);
});

test('inicioDeLaSerie cubre los doce meses (y con eso las doce semanas)', () => {
  assert.equal(inicioDeLaSerie(new Date('2026-09-10T15:00:00Z')).toISOString(), '2025-10-01T03:00:00.000Z');
});

test('inicioDeDia: 00:00 hora argentina', () => {
  // 27/9 23:30 AR = 28/9 02:30 UTC: sigue siendo el 27.
  assert.equal(inicioDeDia(new Date('2026-09-28T02:30:00Z')).toISOString(), '2026-09-27T03:00:00.000Z');
  assert.equal(inicioDeDia(new Date('2026-09-28T03:00:00Z')).toISOString(), '2026-09-28T03:00:00.000Z');
});

test('dia: el pedido de las 23:30 cuenta ayer; la serie trae doce dias con rotulo d/m', () => {
  const ahora = new Date('2026-09-28T12:00:00Z'); // lunes 28/9 09:00 AR
  const r = resumir({
    ...base,
    ahora,
    pedidos: [pedido('2026-09-28T02:30:00Z', 'entregado', 1000), pedido('2026-09-28T11:00:00Z', 'entregado', 2000)],
  });
  assert.equal(r.dia.anterior.ventasCentavos, 1000);
  assert.equal(r.dia.actual.ventasCentavos, 2000);
  assert.equal(r.dia.serie.length, 12);
  assert.equal(r.dia.serie[11].rotulo, '28/9');
  assert.equal(r.dia.serie[10].rotulo, '27/9');
  assert.equal(r.dia.serie[0].rotulo, '17/9');
  // Cambio de mes: el 1/10 y el 30/9 son dias seguidos.
  const oct = resumir({ ...base, ahora: new Date('2026-10-01T15:00:00Z'), pedidos: [] }).dia.serie;
  assert.deepEqual(oct.slice(-2).map((p) => p.rotulo), ['30/9', '1/10']);
});

test('"Pedidos" es el total menos los cancelados, con los seis estados', () => {
  const ahora = new Date('2026-09-10T15:00:00Z');
  const dia = '2026-09-05T15:00:00Z';
  const r = resumir({
    ...base,
    ahora,
    pedidos: [
      pedido(dia, 'pendiente', 100),
      pedido(dia, 'en_preparacion', 100),
      pedido(dia, 'preparado', 100),
      pedido(dia, 'listo', 100),
      pedido(dia, 'entregado', 100),
      pedido(dia, 'cancelado', 100),
      pedido(dia, 'cancelado', 100),
    ],
  });
  assert.equal(r.mes.actual.pedidos, 5);
  assert.equal(r.mes.actual.porEstado.preparado, 1);
  assert.equal(r.mes.actual.porEstado.listo, 1);
  assert.equal(r.mes.actual.porEstado.cancelado, 2);
});

test('entregadosSinTicket cuenta solo los entregados con monto estimado', () => {
  const ahora = new Date('2026-09-10T15:00:00Z');
  const dia = '2026-09-05T15:00:00Z';
  const r = resumir({
    ...base,
    ahora,
    pedidos: [
      pedido(dia, 'entregado', 4530000, false),
      pedido(dia, 'entregado', 2000000, true),
      // Un preparado sin ticket no es venta ni cuenta aca.
      pedido(dia, 'listo', 1000, true),
    ],
  });
  assert.equal(r.mes.actual.entregadosSinTicket, 1);
  assert.equal(r.mes.actual.ventasCentavos, 6530000);
  assert.equal(r.mes.anterior.entregadosSinTicket, 0);
});

// Lo minimo de un Decimal: mul y toNumber, redondeando como la columna Decimal(12,2).
const dec = (n: number) => ({ mul: (m: number) => ({ toNumber: () => Math.round(n * m) }) });

test('montoDelPedido: el monto real manda sobre el estimado', () => {
  assert.deepEqual(montoDelPedido({ estimatedTotal: dec(40000), montoReal: dec(45300.5) }), {
    montoCentavos: 4530050,
    montoEsEstimado: false,
  });
  assert.deepEqual(montoDelPedido({ estimatedTotal: dec(40000), montoReal: null }), {
    montoCentavos: 4000000,
    montoEsEstimado: true,
  });
});
