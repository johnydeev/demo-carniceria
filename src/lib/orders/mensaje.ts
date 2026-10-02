import { formatPrice } from '../productUtils.ts';
import { esPaquete, esPieza, formatearCantidad } from '../cart/cantidades.ts';
import { nombreTurnoAbsoluto } from '../horario/nombres.ts';

export interface ItemParaMensaje {
  name: string;
  unit: string;
  quantity: number;
  isOffer: boolean;
  packQuantity: number;
  /** Por pieza: ya es el estimado por pieza (precio por kilo por el peso aproximado). */
  unitPrice: number;
  pesoAprox?: number | null;
}

export interface PedidoParaMensaje {
  number: number;
  items: ItemParaMensaje[];
  estimatedTotal: number;
  delivery: 'retiro' | 'envio';
  address?: string | null;
  addressNotes?: string | null;
  customerName: string;
  customerPhone: string;
  notes?: string | null;
  /** Copia del turno elegido (ISO). Null o ausente en pedidos anteriores al horario. */
  turnoInicio?: string | null;
  turnoFin?: string | null;
  /** El metodo que eligio el cliente al pedir. Null o ausente en pedidos anteriores al cobro. */
  metodoPagoElegido?: 'efectivo' | 'transferencia' | null;
}

/**
 * Como se escribe la cantidad de una linea ya pedida, para el mensaje, el
 * detalle del cliente y el panel. Un paquete va "2": el nombre real ya dice
 * lo que trae ("Alitas x 3KG"). Una linea suelta va "1,5 kg". Una pieza va
 * "1 pieza (aprox. 10 kg)". Si era oferta, "(oferta)" al final en todos los
 * casos: el dueno tiene que ver el precio promo.
 */
export function cantidadItem(
  i: Pick<ItemParaMensaje, 'unit' | 'isOffer' | 'packQuantity' | 'quantity' | 'pesoAprox'>
): string {
  const regla = { unit: i.unit, isOffer: i.isOffer, quantity: i.packQuantity, pesoAprox: i.pesoAprox };
  let cantidad: string;
  if (esPieza(regla)) {
    const peso = (i.pesoAprox as number).toLocaleString('es-AR', { maximumFractionDigits: 1 });
    cantidad = `${formatearCantidad(i.quantity, regla)} (aprox. ${peso} kg)`;
  } else if (esPaquete(regla)) {
    cantidad = i.quantity.toLocaleString('es-AR');
  } else {
    cantidad = formatearCantidad(i.quantity, regla);
  }
  return `${cantidad}${i.isOffer ? ' (oferta)' : ''}`;
}

/** Una pieza se marca "estimado": el precio real sale de la balanza. */
function sufijoPrecio(i: ItemParaMensaje): string {
  return esPieza({ unit: i.unit, isOffer: i.isOffer, quantity: i.packQuantity, pesoAprox: i.pesoAprox })
    ? ' estimado'
    : '';
}

/**
 * Direccion y piso en una sola linea: "Calle falsa 123, 3 A", o solo la
 * direccion si no hay piso. La misma forma en /pedido, el mensaje, el detalle
 * del cliente y el panel.
 */
export function direccionEnLinea(address?: string | null, addressNotes?: string | null): string {
  return [address, addressNotes]
    .map((x) => x?.trim())
    .filter(Boolean)
    .join(', ');
}

/** El turno del pedido para leer despues ("martes 29/9 por la tarde (17:00 a 20:45)"), o null sin turno. */
export function turnoDelPedido(p: Pick<PedidoParaMensaje, 'turnoInicio' | 'turnoFin'>): string | null {
  if (!p.turnoInicio || !p.turnoFin) return null;
  return nombreTurnoAbsoluto({ inicio: new Date(p.turnoInicio), fin: new Date(p.turnoFin) });
}

/**
 * El texto que el cliente le manda al comercio. Pura, con tests: es lo que
 * el dueno lee en el celular, y un formato roto es un pedido mal entendido.
 */
export function textoPedido(p: PedidoParaMensaje): string {
  const lineas = [`Hola! Pedido #${p.number} desde la web`];

  for (const i of p.items) {
    lineas.push(
      `• ${i.name} × ${cantidadItem(i)} — ${formatPrice(Math.round(i.unitPrice * i.quantity))}${sufijoPrecio(i)}`
    );
  }

  lineas.push(`Total estimado: ${formatPrice(p.estimatedTotal)} (se ajusta al pesar)`);

  const turno = turnoDelPedido(p);
  if (p.delivery === 'envio') {
    lineas.push(`Envío a domicilio: ${direccionEnLinea(p.address, p.addressNotes)}`);
    if (turno) lineas.push(`Entrega: ${turno}`);
  } else {
    lineas.push(turno ? `Retiro en el local: ${turno}` : 'Retiro en el local');
  }

  if (p.metodoPagoElegido) lineas.push(`Pago: ${p.metodoPagoElegido}`);

  lineas.push(`Nombre: ${p.customerName} · Tel: ${p.customerPhone}`);

  if (p.notes && p.notes.trim()) lineas.push(`Notas: ${p.notes.trim()}`);

  return lineas.join('\n');
}

export function urlWhatsApp(telefono: string, p: PedidoParaMensaje): string {
  return `https://wa.me/${telefono}?text=${encodeURIComponent(textoPedido(p))}`;
}

/**
 * La misma conversacion por el esquema de la app. En el celular, `wa.me`
 * abierto por codigo —no por un toque sobre un enlace— no dispara la app:
 * cae en la pagina intermedia de WhatsApp con "Abrir aplicacion". El
 * esquema `whatsapp://` abre la app instalada directo, con el mensaje listo.
 */
export function urlWhatsAppApp(telefono: string, p: PedidoParaMensaje): string {
  return `whatsapp://send?phone=${telefono}&text=${encodeURIComponent(textoPedido(p))}`;
}
