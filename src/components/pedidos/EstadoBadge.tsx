import { textoEstadoCliente, type PedidoParaAccion } from '@/lib/orders/estados';

type PedidoParaBadge = Pick<PedidoParaAccion, 'status' | 'delivery' | 'metodoPago' | 'metodoPagoElegido'>;

/**
 * El estado como lo lee el cliente. Recibe el pedido y no solo el estado:
 * "preparado" dice si espera el pago (transferencia) y "listo", si es para
 * retirar o para enviar.
 */
export default function EstadoBadge({ pedido }: { pedido: PedidoParaBadge }) {
  return <span className={`estado estado-${pedido.status}`}>{textoEstadoCliente(pedido)}</span>;
}
