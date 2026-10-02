/**
 * Metricas del inicio del panel. Pura, con tests: sin Prisma ni React. Recibe
 * pedidos y altas ya normalizados (monto en centavos enteros, fecha que cuenta)
 * y los agrupa por dia, semana y mes en hora argentina.
 *
 * Argentina es UTC-3 fijo (sin horario de verano desde 2009), como fechas.ts:
 * se corre el instante 3 horas y se leen los campos UTC.
 */
import { ESTADOS, type EstadoPedido } from './orders/estados.ts';

const OFFSET_MS = 3 * 60 * 60 * 1000;

/** El mismo instante, con los campos UTC mostrando la hora argentina. */
const enArgentina = (f: Date) => new Date(f.getTime() - OFFSET_MS);

/** 00:00 hora argentina del dia de `f`. */
export function inicioDeDia(f: Date): Date {
  const a = enArgentina(f);
  return new Date(Date.UTC(a.getUTCFullYear(), a.getUTCMonth(), a.getUTCDate()) + OFFSET_MS);
}

/** Dia 1 a las 00:00 hora argentina del mes de `f`. */
export function inicioDeMes(f: Date): Date {
  const a = enArgentina(f);
  return new Date(Date.UTC(a.getUTCFullYear(), a.getUTCMonth(), 1) + OFFSET_MS);
}

/** Lunes a las 00:00 hora argentina de la semana de `f`. */
export function inicioDeSemana(f: Date): Date {
  const a = enArgentina(f);
  const desdeLunes = (a.getUTCDay() + 6) % 7;
  return new Date(Date.UTC(a.getUTCFullYear(), a.getUTCMonth(), a.getUTCDate() - desdeLunes) + OFFSET_MS);
}

const DIA_MS = 24 * 60 * 60 * 1000;
const SEMANA_MS = 7 * DIA_MS;
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/** Cuantos periodos muestra el grafico, contando el en curso. */
export const PERIODOS_EN_SERIE = 12;

export type Periodo = 'dia' | 'semana' | 'mes';

export interface PedidoMetrica {
  fecha: Date;
  estado: EstadoPedido;
  montoCentavos: number;
  /** Sin ticket: el monto es el total estimado, no el cobrado. */
  montoEsEstimado: boolean;
}

export interface ClienteMetrica {
  alta: Date;
}

export interface ResumenPeriodo {
  /** Todos menos los cancelados. */
  pedidos: number;
  porEstado: Record<EstadoPedido, number>;
  /** Solo entregados. */
  ventasCentavos: number;
  entregados: number;
  /** Entregados que suman el total estimado porque no tienen ticket. */
  entregadosSinTicket: number;
  /** Null sin entregados: no hay promedio, no es cero. */
  ticketCentavos: number | null;
  clientesNuevos: number;
}

export interface PuntoSerie {
  inicio: string;
  rotulo: string;
  ventasCentavos: number;
  enCurso: boolean;
}

export interface MetricasPeriodo {
  actual: ResumenPeriodo;
  anterior: ResumenPeriodo;
  /** De la mas vieja a la en curso. */
  serie: PuntoSerie[];
}

export interface Metricas {
  clientesTotal: number;
  dia: MetricasPeriodo;
  semana: MetricasPeriodo;
  mes: MetricasPeriodo;
}

const inicioDe = (periodo: Periodo, f: Date) =>
  periodo === 'mes' ? inicioDeMes(f) : periodo === 'semana' ? inicioDeSemana(f) : inicioDeDia(f);

/** Inicio del periodo `n` lugares despues de `inicio` (negativo: antes). */
function correr(periodo: Periodo, inicio: Date, n: number): Date {
  // Sin horario de verano, un dia y una semana miden siempre lo mismo.
  if (periodo === 'dia') return new Date(inicio.getTime() + n * DIA_MS);
  if (periodo === 'semana') return new Date(inicio.getTime() + n * SEMANA_MS);
  const a = enArgentina(inicio);
  return new Date(Date.UTC(a.getUTCFullYear(), a.getUTCMonth() + n, 1) + OFFSET_MS);
}

/** Desde cuando hay que leer: el mes mas viejo del grafico; cubre tambien los doce dias y las doce semanas. */
export function inicioDeLaSerie(ahora: Date): Date {
  return correr('mes', inicioDeMes(ahora), -(PERIODOS_EN_SERIE - 1));
}

/** Lo minimo de un Prisma.Decimal que hace falta aca: la libreria no importa Prisma. */
interface Decimalish {
  mul(n: number): { toNumber(): number };
}

/**
 * El monto de un pedido para las metricas: el del ticket si esta, si no el
 * estimado. A centavos sobre el Decimal (la columna es Decimal(12,2): por 100
 * da un entero exacto); de ahi en adelante se suman enteros.
 */
export function montoDelPedido(p: { estimatedTotal: Decimalish; montoReal: Decimalish | null }): {
  montoCentavos: number;
  montoEsEstimado: boolean;
} {
  const monto = p.montoReal ?? p.estimatedTotal;
  return { montoCentavos: monto.mul(100).toNumber(), montoEsEstimado: p.montoReal === null };
}

function rotulo(periodo: Periodo, inicio: Date): string {
  const a = enArgentina(inicio);
  return periodo === 'mes' ? MESES[a.getUTCMonth()] : `${a.getUTCDate()}/${a.getUTCMonth() + 1}`;
}

function resumen(pedidos: PedidoMetrica[], clientes: ClienteMetrica[], desde: Date, hasta: Date): ResumenPeriodo {
  const dentro = (f: Date) => f.getTime() >= desde.getTime() && f.getTime() < hasta.getTime();
  const porEstado = Object.fromEntries(ESTADOS.map((e) => [e, 0])) as Record<EstadoPedido, number>;
  let total = 0;
  let ventasCentavos = 0;
  let entregadosSinTicket = 0;
  for (const p of pedidos) {
    if (!dentro(p.fecha)) continue;
    total += 1;
    porEstado[p.estado] += 1;
    if (p.estado === 'entregado') {
      ventasCentavos += p.montoCentavos;
      if (p.montoEsEstimado) entregadosSinTicket += 1;
    }
  }
  const entregados = porEstado.entregado;
  return {
    // Total menos cancelados, no una suma fija de estados: la suma se rompia al agregar uno.
    pedidos: total - porEstado.cancelado,
    porEstado,
    ventasCentavos,
    entregados,
    entregadosSinTicket,
    ticketCentavos: entregados > 0 ? Math.round(ventasCentavos / entregados) : null,
    clientesNuevos: clientes.filter((c) => dentro(c.alta)).length,
  };
}

function metricasDe(periodo: Periodo, pedidos: PedidoMetrica[], clientes: ClienteMetrica[], ahora: Date): MetricasPeriodo {
  const actual = inicioDe(periodo, ahora);
  const serie: PuntoSerie[] = [];
  for (let i = PERIODOS_EN_SERIE - 1; i >= 0; i--) {
    const desde = correr(periodo, actual, -i);
    serie.push({
      inicio: desde.toISOString(),
      rotulo: rotulo(periodo, desde),
      ventasCentavos: resumen(pedidos, [], desde, correr(periodo, desde, 1)).ventasCentavos,
      enCurso: i === 0,
    });
  }
  return {
    actual: resumen(pedidos, clientes, actual, correr(periodo, actual, 1)),
    anterior: resumen(pedidos, clientes, correr(periodo, actual, -1), actual),
    serie,
  };
}

export function resumir(datos: {
  pedidos: PedidoMetrica[];
  clientes: ClienteMetrica[];
  clientesTotal: number;
  ahora: Date;
}): Metricas {
  const { pedidos, clientes, clientesTotal, ahora } = datos;
  return {
    clientesTotal,
    dia: metricasDe('dia', pedidos, clientes, ahora),
    semana: metricasDe('semana', pedidos, clientes, ahora),
    mes: metricasDe('mes', pedidos, clientes, ahora),
  };
}
