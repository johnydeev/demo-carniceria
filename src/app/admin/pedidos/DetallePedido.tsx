'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ETIQUETA_ESTADO,
  NOMBRE_ACCION,
  accionPrincipal,
  accionesDesde,
  metodoVigente,
  textoMetodo,
  type Accion,
} from '@/lib/orders/estados';
import { mensajeAviso, urlAviso } from '@/lib/orders/aviso';
import { cantidadItem, direccionEnLinea, turnoDelPedido } from '@/lib/orders/mensaje';
import { numeroWhatsApp } from '@/lib/orders/telefono';
import { formatPrice } from '@/lib/productUtils';
import { fechaHoraNumerica } from '@/lib/fechas';
import { negocio } from '@/config/negocio.config';
import type { CobroVista, EventoVista, PedidoVista } from '@/demo/tipos';

const DIRECCION_LOCAL = `${negocio.direccion.calle}, ${negocio.direccion.localidad}`;

interface Props {
  pedido: PedidoVista;
  /** Null mientras carga o si fallo; `errorCobro` distingue los dos casos. */
  cobro: CobroVista | null;
  errorCobro: boolean;
  /** Hay un modal de accion abierto sobre este pedido: sus botones se apagan. */
  ocupado: boolean;
  onAccion: (accion: Accion) => void;
}

/**
 * La fila expandida es el detalle del pedido, y es lo que se usa desde el
 * celular: una accion principal grande por estado, las secundarias al lado,
 * el aviso por WhatsApp, los archivos y el historial.
 */
export default function DetallePedido({ pedido: p, cobro, errorCobro, ocupado, onAccion }: Props) {
  const principal = accionPrincipal(p.status);
  const secundarias = accionesDesde(p).filter((a) => a !== principal);
  const wa = numeroWhatsApp(p.customerPhone);
  const aviso = mensajeAviso(p, {
    alias: cobro?.alias ?? '',
    titular: cobro?.titular ?? '',
    direccionLocal: DIRECCION_LOCAL,
  });
  const faltaAlias =
    p.status === 'preparado' && metodoVigente(p) === 'transferencia' && cobro !== null && cobro.alias.trim() === '';
  // Sin los datos de cobro, el aviso de un preparado por transferencia saldria
  // sin alias ("te pasamos los datos"): se espera a que carguen.
  const esperandoCobro =
    cobro === null && !errorCobro && p.status === 'preparado' && metodoVigente(p) === 'transferencia';
  const turno = turnoDelPedido(p);

  return (
    <div className="admin-detalle">
      <ul>
        {p.items.map((i, idx) => (
          <li key={idx}>
            {i.name} × {cantidadItem(i)} — {formatPrice(Math.round(i.unitPrice * i.quantity))}
          </li>
        ))}
      </ul>

      <dl className="admin-detalle-datos">
        <div>
          <dt>Total</dt>
          <dd>
            {p.montoReal !== null
              ? `${formatPrice(p.montoReal)} (estimado ${formatPrice(p.estimatedTotal)})`
              : `${formatPrice(p.estimatedTotal)} estimado`}
          </dd>
        </div>
        <div>
          <dt>Pago</dt>
          <dd>{textoMetodo(p)}</dd>
        </div>
        <div>
          <dt>Entrega</dt>
          <dd>
            {p.delivery === 'envio' ? `Envío: ${direccionEnLinea(p.address, p.addressNotes)}` : 'Retiro en el local'}
            {turno ? ` · ${turno}` : ''}
          </dd>
        </div>
        {p.entregadoEn && (
          <div>
            <dt>Entregado</dt>
            <dd>{fechaHoraNumerica(p.entregadoEn)}</dd>
          </div>
        )}
        {p.motivoCancelacion && (
          <div>
            <dt>Motivo</dt>
            <dd>{p.motivoCancelacion}</dd>
          </div>
        )}
        {p.notes && (
          <div>
            <dt>Notas</dt>
            <dd>{p.notes}</dd>
          </div>
        )}
        {p.customerEmail && (
          <div>
            <dt>Email</dt>
            <dd>{p.customerEmail}</dd>
          </div>
        )}
      </dl>

      {(p.tieneTicket || p.tieneComprobante) && (
        <div className="admin-actions">
          {p.tieneTicket && (
            <a
              className="admin-btn secondary"
              href={`/api/admin/orders/${p.id}/archivo?tipo=ticket`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Ver ticket
            </a>
          )}
          {p.tieneComprobante && (
            <a
              className="admin-btn secondary"
              href={`/api/admin/orders/${p.id}/archivo?tipo=comprobante`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Ver comprobante
            </a>
          )}
        </div>
      )}

      {(p.status === 'en_preparacion' || p.status === 'preparado' || p.status === 'listo') && (
        <div className="admin-actions">
          {wa && aviso && esperandoCobro ? (
            <>
              <button type="button" className="admin-btn whatsapp" disabled>
                <span className="admin-spinner" aria-hidden="true" />
                Avisar por WhatsApp
              </button>
              <span className="admin-muted">Cargando datos de cobro…</span>
            </>
          ) : wa && aviso ? (
            <a className="admin-btn whatsapp" href={urlAviso(wa, aviso)} target="_blank" rel="noopener noreferrer">
              Avisar por WhatsApp
            </a>
          ) : (
            <span className="admin-muted">Tel: {p.customerPhone}</span>
          )}
          {faltaAlias && (
            <Link href="/admin/cobro" className="admin-helper warning">
              Cargá el alias en Cobro
            </Link>
          )}
          {/* Solo importa en preparado: es el aviso que lleva el alias. */}
          {errorCobro && p.status === 'preparado' && (
            <span className="admin-helper warning">No se pudieron leer los datos de cobro.</span>
          )}
        </div>
      )}

      {(principal || secundarias.length > 0) && (
        <div className="admin-actions admin-detalle-acciones">
          {principal && <BotonAccion accion={principal} principal ocupado={ocupado} onAccion={onAccion} />}
          {secundarias.map((a) => (
            <BotonAccion key={a} accion={a} ocupado={ocupado} onAccion={onAccion} />
          ))}
        </div>
      )}

      {/* La key hace que el historial se vuelva a pedir despues de cada accion. */}
      <Historial key={p.updatedAt} pedido={p} />
    </div>
  );
}

function BotonAccion({
  accion,
  principal = false,
  ocupado,
  onAccion,
}: {
  accion: Accion;
  principal?: boolean;
  ocupado: boolean;
  onAccion: (accion: Accion) => void;
}) {
  const clase = accion === 'cancelar' ? 'danger' : principal ? 'primary admin-btn-grande' : 'secondary';
  return (
    <button type="button" className={`admin-btn ${clase}`} disabled={ocupado} onClick={() => onAccion(accion)}>
      {NOMBRE_ACCION[accion]}
    </button>
  );
}

/** Se pide recien al expandir: la lista trae hasta 200 pedidos. */
function Historial({ pedido: p }: { pedido: PedidoVista }) {
  const [eventos, setEventos] = useState<EventoVista[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let vivo = true;
    fetch(`/api/admin/orders/${p.id}/eventos`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error())))
      .then((d: { eventos: EventoVista[] }) => {
        if (vivo) setEventos(d.eventos);
      })
      .catch(() => {
        if (vivo) setError(true);
      });
    return () => {
      vivo = false;
    };
  }, [p.id]);

  return (
    <section className="admin-historial" aria-label="Historial del pedido">
      <h3>Historial</h3>
      <ol>
        <li>
          <time>{fechaHoraNumerica(p.createdAt)}</time> Pedido recibido
        </li>
        {eventos?.map((e) => (
          <li key={e.id}>
            <time>{fechaHoraNumerica(e.creadoEn)}</time> {e.estado ? ETIQUETA_ESTADO[e.estado] : 'Cambio'}
            {e.nota && ` · ${e.nota}`}
            <span className="admin-muted"> — {e.admin ?? 'un admin que ya no existe'}</span>
          </li>
        ))}
      </ol>
      {eventos === null && !error && (
        <p className="admin-muted">
          <span className="admin-spinner" aria-hidden="true" />
          Cargando historial…
        </p>
      )}
      {error && <p className="admin-error">No se pudo leer el historial.</p>}
    </section>
  );
}
