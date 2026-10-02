'use client';

import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import {
  EN_CURSO,
  ESTADOS,
  ETIQUETA_ESTADO,
  NOMBRE_ACCION,
  accionPrincipal,
  type Accion,
  type EstadoPedido,
} from '@/lib/orders/estados';
import { MAX_ARCHIVO_TOPE_MB } from '@/lib/orders/cobro';
import { direccionEnLinea } from '@/lib/orders/mensaje';
import { formatPrice } from '@/lib/productUtils';
import type { CobroVista, PedidoVista } from '@/demo/tipos';
import { PEDIDOS_CAMBIARON } from '@/components/admin/AdminNav';
import { numeroWhatsApp } from '@/lib/orders/telefono';
import { fechaHoraNumerica } from '@/lib/fechas';
import { agruparPorTurno } from '@/lib/horario/agrupar';
import { nombreTurno } from '@/lib/horario/nombres';
import DetallePedido from './DetallePedido';
import ModalAccion, { type AccionConModal } from './ModalAccion';

const fecha = fechaHoraNumerica;

export default function AdminPedidosPage() {
  // Por defecto "en curso": todo lo que no esta entregado ni cancelado.
  const [filtro, setFiltro] = useState<EstadoPedido[]>([...EN_CURSO]);
  const [pedidos, setPedidos] = useState<PedidoVista[]>([]);
  const [cargando, setCargando] = useState(true);
  const [abierto, setAbierto] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // El modal guarda una foto del pedido: si un 409 recarga la lista y el pedido sale del filtro, el modal sigue.
  const [modal, setModal] = useState<{ accion: AccionConModal; pedido: PedidoVista } | null>(null);
  const [cobro, setCobro] = useState<CobroVista | null>(null);
  const [errorCobro, setErrorCobro] = useState(false);

  // Numero de la ultima carga pedida: tildar filtros rapido lanza varias, y
  // una respuesta vieja que llegaba ultima pintaba el filtro anterior.
  const ultimaCarga = useRef(0);

  const cargar = useCallback(async () => {
    const esta = ++ultimaCarga.current;
    // Sin ningun estado tildado no hay nada que mostrar. Un `status=` vacio lo
    // rechaza la API (400).
    if (filtro.length === 0) {
      setPedidos([]);
      setCargando(false);
      return;
    }
    setCargando(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/orders?status=${filtro.join(',')}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (esta === ultimaCarga.current) setPedidos(data.pedidos);
    } catch {
      if (esta === ultimaCarga.current) setError('No se pudieron cargar los pedidos.');
    } finally {
      if (esta === ultimaCarga.current) setCargando(false);
    }
  }, [filtro]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // Alias y titular para el aviso, y el tope de archivo. Una lectura; si
  // falla, el detalle lo dice (no "cargá el alias", que haria creer que esta vacio).
  useEffect(() => {
    let vivo = true;
    fetch('/api/admin/cobro')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error())))
      .then((d: { cobro: CobroVista }) => {
        if (vivo) setCobro(d.cobro);
      })
      .catch(() => {
        if (vivo) setErrorCobro(true);
      });
    return () => {
      vivo = false;
    };
  }, []);

  /** Manda la accion y reemplaza el pedido en la lista. Lanza Error con el mensaje del servidor. */
  const enviar = async (p: PedidoVista, body: Record<string, unknown>): Promise<PedidoVista> => {
    const res = await fetch(`/api/admin/orders/${p.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      // Otra pestana se adelanto o el pedido ya no esta en ese estado: se recarga para ver el real.
      if (res.status === 409) cargar();
      throw new Error(data.error || 'No se pudo guardar. Probá de nuevo.');
    }
    setPedidos((lista) => lista.map((x) => (x.id === p.id ? data.pedido : x)));
    window.dispatchEvent(new Event(PEDIDOS_CAMBIARON));
    return data.pedido;
  };

  /** Toda accion abre su modal; aceptar tambien, para confirmar el stock. */
  const accionar = (p: PedidoVista, accion: Accion) => setModal({ accion, pedido: p });

  const toggleFiltro = (e: EstadoPedido) =>
    setFiltro((f) => (f.includes(e) ? f.filter((x) => x !== e) : [...f, e]));

  return (
    <div className="admin-card">
      <h1 className="admin-h1">Pedidos</h1>

      <div className="admin-actions" role="group" aria-label="Filtrar por estado">
        <button type="button" className="admin-btn secondary" onClick={() => setFiltro([...EN_CURSO])}>
          En curso
        </button>
        <button type="button" className="admin-btn secondary" onClick={() => setFiltro([...ESTADOS])}>
          Todos
        </button>
        {ESTADOS.map((e) => (
          <label key={e} className="admin-filtro">
            <input type="checkbox" checked={filtro.includes(e)} onChange={() => toggleFiltro(e)} /> {ETIQUETA_ESTADO[e]}
          </label>
        ))}
      </div>

      {error && <p className="admin-error">{error}</p>}

      {cargando ? (
        <p className="admin-muted">
          <span className="admin-spinner" aria-hidden="true" />
          Cargando…
        </p>
      ) : pedidos.length === 0 ? (
        <p className="admin-muted">No hay pedidos con ese filtro.</p>
      ) : (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Fecha</th>
                <th>Cliente</th>
                <th>Entrega</th>
                <th>Total</th>
                <th>Estado</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {agruparPorTurno(pedidos, new Date()).map((g) => (
                <Fragment key={g.clave}>
                  <tr className="admin-grupo-turno">
                    <th colSpan={7} scope="colgroup">
                      {g.inicio && g.fin
                        ? nombreTurno({ inicio: new Date(g.inicio), fin: new Date(g.fin) }, new Date())
                        : 'Sin turno'}
                      {` · ${g.pedidos.length} ${g.pedidos.length === 1 ? 'pedido' : 'pedidos'}`}
                      {g.atrasado && <span className="admin-atrasado">atrasado</span>}
                    </th>
                  </tr>
                  {g.pedidos.map((p) => (
                    <PedidoFila
                      key={p.id}
                      pedido={p}
                      expandido={abierto === p.id}
                      ocupado={modal?.pedido.id === p.id}
                      cobro={cobro}
                      errorCobro={errorCobro}
                      onToggle={() => setAbierto((a) => (a === p.id ? null : p.id))}
                      onAccion={(accion) => accionar(p, accion)}
                    />
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <ModalAccion
          key={`${modal.pedido.id}-${modal.accion}`}
          accion={modal.accion}
          pedido={modal.pedido}
          maxArchivoMB={cobro?.maxArchivoMB ?? MAX_ARCHIVO_TOPE_MB}
          onCerrar={() => setModal(null)}
          onEnviar={async (body) => {
            const nuevo = await enviar(modal.pedido, body);
            // Aceptar deja el modal abierto: ofrece avisarle al cliente que su pedido esta en preparacion.
            if (modal.accion !== 'aceptar') setModal(null);
            return nuevo;
          }}
        />
      )}
    </div>
  );
}

function PedidoFila({
  pedido: p,
  expandido,
  ocupado,
  cobro,
  errorCobro,
  onToggle,
  onAccion,
}: {
  pedido: PedidoVista;
  expandido: boolean;
  ocupado: boolean;
  cobro: CobroVista | null;
  errorCobro: boolean;
  onToggle: () => void;
  onAccion: (accion: Accion) => void;
}) {
  const wa = numeroWhatsApp(p.customerPhone);
  const principal = accionPrincipal(p.status);
  return (
    <>
      <tr className="admin-fila-clic" onClick={onToggle} aria-expanded={expandido}>
        <td>#{p.number}</td>
        <td>{fecha(p.createdAt)}</td>
        <td>
          {p.customerName}
          <br />
          {wa ? (
            <a
              href={`https://wa.me/${wa}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              {p.customerPhone}
            </a>
          ) : (
            p.customerPhone
          )}
        </td>
        <td>{p.delivery === 'envio' ? direccionEnLinea(p.address, p.addressNotes) : 'Retiro'}</td>
        <td>
          {p.montoReal !== null ? (
            formatPrice(p.montoReal)
          ) : (
            <>
              {formatPrice(p.estimatedTotal)} <small className="admin-muted">est.</small>
            </>
          )}
        </td>
        <td>
          <span className={`admin-estado admin-estado-${p.status}`}>{ETIQUETA_ESTADO[p.status]}</span>
        </td>
        <td onClick={(e) => e.stopPropagation()}>
          {principal && (
            <button type="button" className="admin-btn primary" disabled={ocupado} onClick={() => onAccion(principal)}>
              {NOMBRE_ACCION[principal]}
            </button>
          )}
        </td>
      </tr>
      {expandido && (
        <tr className="admin-fila-detalle">
          <td colSpan={7}>
            <DetallePedido pedido={p} cobro={cobro} errorCobro={errorCobro} ocupado={ocupado} onAccion={onAccion} />
          </td>
        </tr>
      )}
    </>
  );
}
