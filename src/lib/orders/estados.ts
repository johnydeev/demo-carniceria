/**
 * Estados de un pedido y las acciones del panel que los mueven. Pura, con
 * tests: es la unica fuente de verdad, la usan la API y el panel. El panel
 * manda una accion con sus datos; el estado siguiente lo decide esta tabla.
 */
export const ESTADOS = ['pendiente', 'en_preparacion', 'preparado', 'listo', 'entregado', 'cancelado'] as const;
export type EstadoPedido = (typeof ESTADOS)[number];

/** Todo lo que no esta entregado ni cancelado: el filtro por defecto del panel. */
export const EN_CURSO: readonly EstadoPedido[] = ['pendiente', 'en_preparacion', 'preparado', 'listo'];

export const METODOS = ['efectivo', 'transferencia'] as const;
export type MetodoPago = (typeof METODOS)[number];

export const ACCIONES = [
  'aceptar',
  'cargarTicket',
  'corregirTicket',
  'registrarPago',
  'registrarEntrega',
  'cambiarModalidad',
  'cancelar',
] as const;
export type Accion = (typeof ACCIONES)[number];

/** Como se llama cada estado en el panel. */
export const ETIQUETA_ESTADO: Record<EstadoPedido, string> = {
  pendiente: 'Pendiente',
  en_preparacion: 'En preparación',
  preparado: 'Preparado',
  listo: 'Listo',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
};

/** El texto del boton de cada accion. */
export const NOMBRE_ACCION: Record<Accion, string> = {
  aceptar: 'Aceptar',
  cargarTicket: 'Cargar ticket',
  corregirTicket: 'Corregir ticket',
  registrarPago: 'Registrar pago',
  registrarEntrega: 'Registrar entrega',
  cambiarModalidad: 'Cambiar tipo de envío',
  cancelar: 'Cancelar',
};

/** Lo que la tabla necesita saber del pedido. PedidoVista lo cumple tal cual. */
export interface PedidoParaAccion {
  status: EstadoPedido;
  delivery: 'retiro' | 'envio';
  metodoPagoElegido: MetodoPago | null;
  metodoPago: MetodoPago | null;
  montoReal: number | null;
  tieneTicket: boolean;
  tieneComprobante: boolean;
}

/**
 * Los datos que trae la accion. `ticket` y `comprobante` dicen si viene un
 * archivo nuevo; las tildes (`verificado`, `cobrado`) son de la accion, no del pedido.
 */
export interface DatosAccion {
  ticket?: boolean;
  montoReal?: number | null;
  metodoPago?: MetodoPago | null;
  comprobante?: boolean;
  verificado?: boolean;
  cobrado?: boolean;
  delivery?: 'retiro' | 'envio' | null;
  address?: string | null;
  /** Aceptar: el encargado confirmo que hay stock de todos los productos. */
  stock?: boolean;
}

const DESDE: Record<Accion, readonly EstadoPedido[]> = {
  aceptar: ['pendiente'],
  cargarTicket: ['en_preparacion'],
  corregirTicket: ['preparado', 'listo'],
  registrarPago: ['preparado'],
  registrarEntrega: ['listo'],
  cambiarModalidad: EN_CURSO,
  cancelar: EN_CURSO,
};

/** A donde lleva cada accion; null: no cambia el estado. */
const DESTINO: Record<Accion, EstadoPedido | null> = {
  aceptar: 'en_preparacion',
  cargarTicket: 'preparado',
  corregirTicket: null,
  registrarPago: 'listo',
  registrarEntrega: 'entregado',
  cambiarModalidad: null,
  cancelar: 'cancelado',
};

const PRINCIPAL: Partial<Record<EstadoPedido, Accion>> = {
  pendiente: 'aceptar',
  en_preparacion: 'cargarTicket',
  preparado: 'registrarPago',
  listo: 'registrarEntrega',
};

export function esEstado(valor: unknown): valor is EstadoPedido {
  return typeof valor === 'string' && (ESTADOS as readonly string[]).includes(valor);
}

export const esEnCurso = (estado: EstadoPedido): boolean => EN_CURSO.includes(estado);

/** El metodo que rige: el usado si ya se registro el pago; si no, el que eligio el cliente. */
export function metodoVigente(p: Pick<PedidoParaAccion, 'metodoPago' | 'metodoPagoElegido'>): MetodoPago | null {
  return p.metodoPago ?? p.metodoPagoElegido;
}

/** Las acciones que el pedido admite ahora. Corregir el ticket en `listo` solo con efectivo: con transferencia el pago ya se verifico por ese monto. */
export function accionesDesde(p: Pick<PedidoParaAccion, 'status' | 'metodoPago' | 'metodoPagoElegido'>): Accion[] {
  return ACCIONES.filter((a) => {
    if (!DESDE[a].includes(p.status)) return false;
    if (a === 'corregirTicket' && p.status === 'listo') return metodoVigente(p) === 'efectivo';
    return true;
  });
}

/** El boton grande de la fila: una sola accion principal por estado. */
export function accionPrincipal(estado: EstadoPedido): Accion | null {
  return PRINCIPAL[estado] ?? null;
}

export function estadoTras(accion: Accion, de: EstadoPedido): EstadoPedido {
  return DESTINO[accion] ?? de;
}

const tieneMonto = (m: number | null | undefined): m is number => typeof m === 'number' && m > 0;

/**
 * Un archivo que la accion o el metodo no llevan. Se rechaza antes de
 * verificar nada: un comprobante de mas no puede pisar el que ya prueba el pago.
 */
export function archivoDeMas(p: PedidoParaAccion, accion: Accion, d: DatosAccion): string | null {
  if (d.ticket && accion !== 'cargarTicket' && accion !== 'corregirTicket') {
    return 'Esta acción no lleva foto del ticket.';
  }
  if (!d.comprobante) return null;
  if (accion === 'registrarPago') {
    return d.metodoPago === 'efectivo' ? 'Con efectivo no hay comprobante.' : null;
  }
  if (accion === 'registrarEntrega') {
    const actual = metodoVigente(p);
    if (actual === 'transferencia') return 'La transferencia ya está verificada: no hace falta otro comprobante.';
    return (d.metodoPago ?? actual) === 'efectivo' ? 'Con efectivo no hay comprobante.' : null;
  }
  return 'Esta acción no lleva comprobante.';
}

/**
 * Lo que falta para aplicar la accion; vacia = procede. El panel la usa para
 * habilitar el boton y el servidor la vuelve a correr (409 con lo que falta).
 */
export function requisitosPara(p: PedidoParaAccion, accion: Accion, d: DatosAccion): string[] {
  if (!accionesDesde(p).includes(accion)) {
    return [`"${NOMBRE_ACCION[accion]}" no corresponde a un pedido ${ETIQUETA_ESTADO[p.status].toLowerCase()}.`];
  }
  const deMas = archivoDeMas(p, accion, d);
  if (deMas) return [deMas];
  const falta: string[] = [];
  switch (accion) {
    case 'cargarTicket':
      if (!d.ticket) falta.push('Falta cargar el ticket.');
      if (!tieneMonto(d.montoReal)) falta.push('Falta el monto.');
      break;
    case 'corregirTicket': {
      const hayMonto = d.montoReal !== undefined && d.montoReal !== null;
      if (!d.ticket && !hayMonto) falta.push('Cargá un ticket nuevo o un monto nuevo.');
      if (hayMonto && !tieneMonto(d.montoReal)) falta.push('Falta el monto.');
      break;
    }
    case 'registrarPago':
      if (!d.metodoPago) {
        falta.push('Elegí el método de pago.');
      } else if (d.metodoPago === 'transferencia') {
        if (!d.comprobante) falta.push('Falta el comprobante.');
        if (!d.verificado) falta.push('Falta tildar que verificaste el ingreso del pago.');
      }
      break;
    case 'registrarEntrega': {
      const actual = metodoVigente(p);
      const metodo = d.metodoPago ?? actual;
      if (!metodo) {
        falta.push('Elegí el método de pago.');
      } else if (actual === 'transferencia' && metodo === 'efectivo') {
        falta.push('El pago ya se registró por transferencia.');
      } else if (metodo === 'efectivo') {
        if (!d.cobrado) falta.push('Falta tildar que cobraste en efectivo.');
      } else if (actual !== 'transferencia') {
        // Transfirio en la puerta: la misma prueba que al registrar el pago.
        if (!d.comprobante) falta.push('Falta el comprobante.');
        if (!d.verificado) falta.push('Falta tildar que verificaste el ingreso del pago.');
      }
      break;
    }
    case 'cambiarModalidad':
      if (!d.delivery) falta.push('Elegí retiro o envío.');
      else if (d.delivery === 'envio' && !d.address?.trim()) falta.push('Falta la dirección de envío.');
      else if (d.delivery === 'retiro' && p.delivery === 'retiro') falta.push('El pedido ya es para retirar.');
      break;
    case 'aceptar':
      // Antes de preparar: asi no hay que avisarle tarde al cliente que falta algo.
      if (!d.stock) falta.push('Confirmá que hay stock de todos los productos para continuar con la preparación.');
      break;
    case 'cancelar':
      break;
  }
  return falta;
}

/** El cliente pago con otro metodo que el que eligio al pedir. */
export function cambioDeMetodo(p: Pick<PedidoParaAccion, 'metodoPago' | 'metodoPagoElegido'>): boolean {
  return Boolean(p.metodoPagoElegido && p.metodoPago && p.metodoPagoElegido !== p.metodoPago);
}

/** Cancelar un `listo` pagado por transferencia deja plata del cliente que hay que devolver. */
export function transferenciaADevolver(p: Pick<PedidoParaAccion, 'status' | 'metodoPago'>): boolean {
  return p.status === 'listo' && p.metodoPago === 'transferencia';
}

/**
 * El aviso de devolucion al cancelar, para el modal y la nota del evento.
 * `listo` + transferencia: el pago esta verificado, hay que devolverlo.
 * `preparado` + transferencia: el cliente pudo haber transferido sin que se
 * registrara todavia, aviso mas suave. `monto` llega ya formateado (el monto real).
 */
export function avisoDeDevolucion(
  p: Pick<PedidoParaAccion, 'status' | 'metodoPago' | 'metodoPagoElegido'>,
  monto: string
): string | null {
  if (transferenciaADevolver(p)) return `Se registró una transferencia de ${monto}: hay que devolverla.`;
  if (p.status === 'preparado' && metodoVigente(p) === 'transferencia') {
    return `Si el cliente ya transfirió, hay que devolverle ${monto}.`;
  }
  return null;
}

/** "Eligió transferencia · cambió a efectivo", para el detalle del panel. */
export function textoMetodo(p: Pick<PedidoParaAccion, 'metodoPago' | 'metodoPagoElegido'>): string {
  const { metodoPagoElegido: elegido, metodoPago: usado } = p;
  if (elegido && usado && elegido !== usado) return `Eligió ${elegido} · cambió a ${usado}`;
  if (usado) return `Pago: ${usado}`;
  if (elegido) return `Eligió ${elegido}`;
  return 'Sin método elegido';
}

/** El estado como lo lee el cliente en /cuenta/pedidos. */
export function textoEstadoCliente(
  p: Pick<PedidoParaAccion, 'status' | 'delivery' | 'metodoPago' | 'metodoPagoElegido'>
): string {
  switch (p.status) {
    case 'pendiente':
      return 'Recibido';
    case 'en_preparacion':
      return 'En preparación';
    case 'preparado':
      return metodoVigente(p) === 'transferencia' ? 'Esperando el pago' : 'Preparado';
    case 'listo':
      return p.delivery === 'envio' ? 'Listo para enviar' : 'Listo para retirar';
    case 'entregado':
      return 'Entregado';
    case 'cancelado':
      return 'Cancelado';
  }
}
