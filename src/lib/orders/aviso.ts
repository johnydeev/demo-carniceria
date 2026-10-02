/**
 * El mensaje de WhatsApp que el panel le arma al comercio para avisarle al
 * cliente, en `en_preparacion` (que se esta armando), en `preparado` (cuanto paga) y en `listo` (que ya puede pasar o que
 * sale). Puro, con tests. El aviso se manda a mano: el enlace solo lo deja escrito.
 */
import { formatPrice } from '../productUtils.ts';
import { metodoVigente, type EstadoPedido, type MetodoPago } from './estados.ts';
import { turnoDelPedido } from './mensaje.ts';

export interface PedidoParaAviso {
  number: number;
  status: EstadoPedido;
  delivery: 'retiro' | 'envio';
  customerName: string;
  montoReal: number | null;
  metodoPago: MetodoPago | null;
  metodoPagoElegido: MetodoPago | null;
  turnoInicio?: string | null;
  turnoFin?: string | null;
}

export interface DatosAviso {
  alias: string;
  titular: string;
  /** "Av. Belgrano 1450, Barrio Centro", de negocio.config. */
  direccionLocal: string;
}

/** El primer nombre: "Hola Juan!", no "Hola Juan Pérez!". */
const primerNombre = (nombre: string) => nombre.trim().split(/\s+/)[0] ?? '';

/** Null en los estados sin aviso, o en `preparado` sin monto real. */
export function mensajeAviso(p: PedidoParaAviso, datos: DatosAviso): string | null {
  const hola = `Hola ${primerNombre(p.customerName)}!`;
  const turno = turnoDelPedido(p);
  const metodo = metodoVigente(p);

  // Recien aceptado: que sepa que se esta armando y que sigue.
  if (p.status === 'en_preparacion') {
    const base = `${hola} Tu pedido #${p.number} está en preparación.`;
    // Sin metodo (pedidos anteriores al cobro), se decide por la modalidad.
    const paga = metodo ?? (p.delivery === 'envio' ? 'transferencia' : 'efectivo');
    if (paga === 'transferencia') return `${base} En breve te enviamos el ticket con el monto para hacer la transferencia.`;
    return `${base} En breve te enviamos el monto a pagar ${p.delivery === 'retiro' ? 'en el local' : 'al recibirlo'}.`;
  }

  if (p.status === 'preparado') {
    if (p.montoReal === null) return null;
    const base = `${hola} Tu pedido #${p.number} ya está armado. El total es ${formatPrice(p.montoReal)}.`;
    if (metodo === 'transferencia') {
      const alias = datos.alias.trim();
      if (!alias) return `${base} Te pasamos los datos para transferir por acá.`;
      const titular = datos.titular.trim() ? ` (${datos.titular.trim()})` : '';
      return `${base} Podés transferir a ${alias}${titular} y mandarnos el comprobante por acá.`;
    }
    if (metodo === 'efectivo') {
      return `${base} Lo pagás al ${p.delivery === 'retiro' ? 'retirar' : 'recibir'}.`;
    }
    return base;
  }

  if (p.status === 'listo') {
    if (p.delivery === 'retiro') {
      return `${hola} Tu pedido #${p.number} está listo para retirar en ${datos.direccionLocal}${turno ? `, el ${turno}` : ''}.`;
    }
    return `${hola} Tu pedido #${p.number} sale para tu domicilio${turno ? ` el ${turno}` : ''}.`;
  }

  return null;
}

/** Enlace a wa.me con el aviso escrito. `numero` ya viene de numeroWhatsApp. */
export function urlAviso(numero: string, texto: string): string {
  return `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`;
}
