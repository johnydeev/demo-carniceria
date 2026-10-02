'use client';

import { useEffect, useRef, useState } from 'react';
import AdminModal from '@/components/admin/AdminModal';
import {
  NOMBRE_ACCION,
  avisoDeDevolucion,
  metodoVigente,
  requisitosPara,
  type Accion,
  type DatosAccion,
  type MetodoPago,
} from '@/lib/orders/estados';
import { ERROR_MONTO, formatearMontoEscrito, parsearMonto } from '@/lib/orders/monto';
import { formatPrice } from '@/lib/productUtils';
import { cantidadItem } from '@/lib/orders/mensaje';
import { mensajeAviso, urlAviso } from '@/lib/orders/aviso';
import { numeroWhatsApp } from '@/lib/orders/telefono';
import type { PedidoVista } from '@/demo/tipos';
import { subirArchivoPedido } from './subirArchivo';

/** Todas abren modal. Aceptar tambien: pide confirmar el stock antes de preparar. */
export type AccionConModal = Accion;

interface Props {
  accion: AccionConModal;
  pedido: PedidoVista;
  /** Tope de /admin/cobro; el de 10 MB si no se pudo leer. */
  maxArchivoMB: number;
  onCerrar: () => void;
  /** Manda la accion. Lanza Error con el mensaje del servidor; si sale bien, el padre cierra el modal. */
  onEnviar: (body: Record<string, unknown>) => Promise<PedidoVista>;
}

/**
 * El modal de cada accion del panel. El boton se habilita con la misma regla
 * que el servidor vuelve a correr (requisitosPara). El archivo se sube recien
 * al confirmar: si la accion no se aplica, el servidor lo borra.
 */
export default function ModalAccion({ accion, pedido: p, maxArchivoMB, onCerrar, onEnviar }: Props) {
  const actual = metodoVigente(p);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [monto, setMonto] = useState(
    accion === 'corregirTicket' && p.montoReal !== null
      ? formatearMontoEscrito(String(p.montoReal).replace('.', ','))
      : ''
  );
  // Registrar pago arranca en el metodo que eligio el cliente; la entrega, en el ya registrado.
  const [metodo, setMetodo] = useState<MetodoPago | null>(accion === 'registrarEntrega' ? actual : p.metodoPagoElegido);
  const [verificado, setVerificado] = useState(false);
  const [cobrado, setCobrado] = useState(false);
  const [delivery, setDelivery] = useState<'retiro' | 'envio'>(p.delivery === 'retiro' ? 'envio' : 'retiro');
  const [address, setAddress] = useState(
    (p.delivery === 'envio' ? p.address : p.perfilDireccion.address) ?? ''
  );
  const [addressNotes, setAddressNotes] = useState(
    (p.delivery === 'envio' ? p.addressNotes : p.perfilDireccion.addressNotes) ?? ''
  );
  const [stock, setStock] = useState(false);
  // Aceptar no cierra el modal: pasa a ofrecer el aviso al cliente con el pedido ya en preparacion.
  const [aceptado, setAceptado] = useState<PedidoVista | null>(null);
  const enlaceAviso = useRef<HTMLAnchorElement>(null);
  // Al pasar a "aceptado" el formulario desaparece: el foco va al boton de aviso.
  useEffect(() => {
    if (aceptado) enlaceAviso.current?.focus();
  }, [aceptado]);
  const [motivo, setMotivo] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const montoLeido = monto.trim() === '' ? null : parsearMonto(monto);
  const montoIlegible = monto.trim() !== '' && montoLeido === null;
  // Un aviso, no un bloqueo: la balanza puede dar distinto, pero la mitad o mas
  // del doble del estimado suele ser un error de tipeo (un cero de mas o de menos).
  const montoMuyDistinto =
    montoLeido !== null && (montoLeido > p.estimatedTotal * 1.5 || montoLeido < p.estimatedTotal * 0.5);
  // Corregir: solo cuenta como monto nuevo si cambio.
  const montoNuevo = accion === 'corregirTicket' && montoLeido === p.montoReal ? null : montoLeido;
  const pideTicket = accion === 'cargarTicket' || accion === 'corregirTicket';
  const pideComprobante =
    (accion === 'registrarPago' && metodo === 'transferencia') ||
    (accion === 'registrarEntrega' && metodo === 'transferencia' && actual !== 'transferencia');

  const datos: DatosAccion = {
    ticket: pideTicket && archivo !== null,
    montoReal: montoNuevo,
    metodoPago: metodo,
    comprobante: pideComprobante && archivo !== null,
    verificado,
    cobrado,
    delivery,
    address,
    stock,
  };
  const faltan = requisitosPara(p, accion, datos);
  const aviso = montoIlegible ? ERROR_MONTO : (faltan[0] ?? null);
  const puedeEnviar = !montoIlegible && faltan.length === 0;

  const montoTexto = formatPrice(p.montoReal ?? p.estimatedTotal);
  const alMomento = p.delivery === 'retiro' ? 'retirar' : 'entregar';
  const devolucion = accion === 'cancelar' ? avisoDeDevolucion(p, montoTexto) : null;

  const cuerpo = (subido: string | null): Record<string, unknown> => {
    switch (accion) {
      case 'aceptar':
        return { accion, stockConfirmado: stock };
      case 'cargarTicket':
        return { accion, ticketPublicId: subido, montoReal: monto };
      case 'corregirTicket':
        return {
          accion,
          ...(subido ? { ticketPublicId: subido } : {}),
          ...(montoNuevo !== null ? { montoReal: monto } : {}),
        };
      case 'registrarPago':
        return metodo === 'transferencia'
          ? { accion, metodoPago: metodo, comprobantePublicId: subido, verificado }
          : { accion, metodoPago: metodo };
      case 'registrarEntrega':
        if (metodo === 'efectivo') return { accion, metodoPago: metodo, cobrado };
        return subido
          ? { accion, metodoPago: metodo, comprobantePublicId: subido, verificado }
          : { accion, metodoPago: metodo };
      case 'cambiarModalidad':
        return delivery === 'envio' ? { accion, delivery, address, addressNotes } : { accion, delivery };
      case 'cancelar':
        return { accion, motivo };
    }
  };

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!puedeEnviar || guardando) return;
    setGuardando(true);
    setError(null);
    try {
      const subido =
        archivo && (pideTicket || pideComprobante)
          ? await subirArchivoPedido(archivo, p.number, pideTicket ? 'ticket' : 'comprobante')
          : null;
      const nuevo = await onEnviar(cuerpo(subido));
      if (accion === 'aceptar') {
        setAceptado(nuevo);
        setGuardando(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar. Probá de nuevo.');
      setGuardando(false);
    }
  };

  if (aceptado) {
    const wa = numeroWhatsApp(aceptado.customerPhone);
    // El aviso de en_preparacion no usa alias ni direccion.
    const texto = mensajeAviso(aceptado, { alias: '', titular: '', direccionLocal: '' });
    return (
      <AdminModal abierto titulo={`Pedido #${aceptado.number} en preparación`} onCerrar={onCerrar}>
        <div className="admin-form">
          <p className="admin-helper">
            Listo: el pedido pasó a preparación. Avisale al cliente que se está armando y que en breve le mandás el
            monto.
          </p>
          <div className="admin-actions">
            {wa && texto ? (
              <a
                className="admin-btn whatsapp"
                href={urlAviso(wa, texto)}
                target="_blank"
                rel="noopener noreferrer"
                ref={enlaceAviso}
                // Cerrar despues de que el navegador siga el enlace: cerrar en el mismo
                // clic desmonta el <a> antes, y Firefox no abre la pestana.
                onClick={() => setTimeout(onCerrar, 0)}
              >
                Avisar al cliente por WhatsApp
              </a>
            ) : (
              <>
                <span className="admin-muted">Tel: {aceptado.customerPhone}</span>
                <button type="button" className="admin-btn secondary" onClick={onCerrar}>
                  Cerrar
                </button>
              </>
            )}
          </div>
        </div>
      </AdminModal>
    );
  }

  return (
    <AdminModal abierto titulo={`${NOMBRE_ACCION[accion]} · Pedido #${p.number}`} onCerrar={onCerrar} bloqueado={guardando}>
      <form className="admin-form" onSubmit={enviar}>
        {accion === 'aceptar' && (
          <>
            <p className="admin-helper">
              Antes de aceptar, revisá que haya stock de todo lo que pidió el cliente. Así no hay que avisarle
              tarde que falta algo.
            </p>
            <ul className="modal-accion-productos">
              {p.items.map((i, idx) => (
                <li key={idx}>
                  {i.name} × {cantidadItem(i)}
                </li>
              ))}
            </ul>
            <label className="admin-check">
              <input type="checkbox" checked={stock} onChange={(e) => setStock(e.target.checked)} />
              Revisé y hay stock de todos los productos de la lista
            </label>
          </>
        )}

        {pideTicket && (
          <>
            <CampoArchivo
              etiqueta={accion === 'corregirTicket' ? 'Foto nueva del ticket (opcional)' : 'Foto del ticket'}
              maxArchivoMB={maxArchivoMB}
              archivo={archivo}
              onElegir={setArchivo}
            />
            <label className="admin-campo">
              Monto real del ticket
              <input
                className="admin-input"
                inputMode="decimal"
                placeholder="45.300,50"
                value={monto}
                // Los miles se separan solos mientras se escribe: "80000" se ve "80.000".
                onChange={(e) => {
                  const escrito = e.target.value;
                  // Con lo anterior: un "." tipeado al final es la coma decimal, no se pierde.
                  setMonto((anterior) => formatearMontoEscrito(escrito, anterior));
                }}
              />
            </label>
            <p className="admin-helper">Los miles se separan solos. Los centavos, con coma.</p>
            <p className="admin-helper">Estimado del pedido: {formatPrice(p.estimatedTotal)}</p>
            {montoMuyDistinto && (
              <p className="admin-helper warning" role="status">
                Revisá el monto: {formatPrice(montoLeido!)} es muy distinto del estimado. ¿Está bien escrito?
              </p>
            )}
          </>
        )}

        {accion === 'registrarPago' && (
          <>
            <fieldset className="admin-opciones">
              <legend>¿Cómo paga?</legend>
              <label>
                <input type="radio" name="metodo" checked={metodo === 'transferencia'} onChange={() => setMetodo('transferencia')} />
                Transferencia
              </label>
              <label>
                <input type="radio" name="metodo" checked={metodo === 'efectivo'} onChange={() => setMetodo('efectivo')} />
                Efectivo
              </label>
            </fieldset>
            {metodo && p.metodoPagoElegido && metodo !== p.metodoPagoElegido && (
              <p className="admin-helper warning">El cliente cambió a {metodo}.</p>
            )}
            {metodo === 'efectivo' && <p className="admin-helper">Se cobra al {alMomento}: se registra en la entrega.</p>}
          </>
        )}

        {accion === 'registrarEntrega' &&
          (actual === 'transferencia' ? (
            <p className="admin-helper">El pago por transferencia ya está verificado.</p>
          ) : (
            <fieldset className="admin-opciones">
              <legend>¿Cómo pagó?</legend>
              <label>
                <input type="radio" name="metodo" checked={metodo === 'efectivo'} onChange={() => setMetodo('efectivo')} />
                Efectivo
              </label>
              <label>
                <input type="radio" name="metodo" checked={metodo === 'transferencia'} onChange={() => setMetodo('transferencia')} />
                El cliente transfirió
              </label>
            </fieldset>
          ))}
        {accion === 'registrarEntrega' && metodo === 'efectivo' && (
          <label className="admin-check">
            <input type="checkbox" checked={cobrado} onChange={(e) => setCobrado(e.target.checked)} />
            Cobré {montoTexto} en efectivo
          </label>
        )}

        {pideComprobante && (
          <>
            <CampoArchivo
              etiqueta="Comprobante de la transferencia"
              maxArchivoMB={maxArchivoMB}
              archivo={archivo}
              onElegir={setArchivo}
            />
            <label className="admin-check">
              <input type="checkbox" checked={verificado} onChange={(e) => setVerificado(e.target.checked)} />
              Verifiqué que el pago ingresó por {montoTexto}
            </label>
          </>
        )}

        {accion === 'cambiarModalidad' && (
          <>
            <fieldset className="admin-opciones">
              <legend>Tipo de envío</legend>
              <label>
                <input type="radio" name="delivery" checked={delivery === 'retiro'} onChange={() => setDelivery('retiro')} />
                Retiro en el local
              </label>
              <label>
                <input type="radio" name="delivery" checked={delivery === 'envio'} onChange={() => setDelivery('envio')} />
                Envío a domicilio
              </label>
            </fieldset>
            {delivery === 'envio' && (
              <>
                <label className="admin-campo">
                  Dirección
                  <input className="admin-input" maxLength={160} value={address} onChange={(e) => setAddress(e.target.value)} />
                </label>
                <label className="admin-campo">
                  Piso, depto o referencia
                  <input
                    className="admin-input"
                    maxLength={160}
                    value={addressNotes}
                    onChange={(e) => setAddressNotes(e.target.value)}
                  />
                </label>
                <p className="admin-helper">Queda solo en este pedido: el perfil del cliente no cambia.</p>
              </>
            )}
            {delivery === 'retiro' && p.delivery === 'envio' && (
              <p className="admin-helper">Se borra la dirección del pedido.</p>
            )}
            <p className="admin-helper">El turno no cambia.</p>
          </>
        )}

        {accion === 'cancelar' && (
          <>
            {devolucion && <p className="admin-helper warning">{devolucion}</p>}
            <label className="admin-campo">
              Motivo (lo ve el cliente, opcional)
              <textarea
                className="admin-textarea"
                rows={3}
                maxLength={300}
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
              />
            </label>
          </>
        )}

        {error && <p className="admin-error">{error}</p>}

        <div className="admin-actions modal-accion-pie">
          <button type="button" className="admin-btn secondary" onClick={onCerrar} disabled={guardando}>
            Volver
          </button>
          <button
            type="submit"
            className={`admin-btn ${accion === 'cancelar' ? 'danger' : 'primary'}`}
            disabled={!puedeEnviar || guardando}
          >
            {guardando && <span className="admin-spinner" aria-hidden="true" />}
            {accion === 'cancelar' ? 'Cancelar pedido' : NOMBRE_ACCION[accion]}
          </button>
          {/* Lo que falta va al lado del boton, en rojo: un boton apagado sin
              explicacion parece roto. */}
          {!error && aviso && (
            <p className="modal-accion-falta" role="status">
              {aviso}
            </p>
          )}
        </div>
      </form>
    </AdminModal>
  );
}

/** Foto o PDF. El tamano se chequea antes de subir; el servidor lo vuelve a chequear. */
function CampoArchivo({
  etiqueta,
  maxArchivoMB,
  archivo,
  onElegir,
}: {
  etiqueta: string;
  maxArchivoMB: number;
  archivo: File | null;
  onElegir: (f: File | null) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  return (
    <label className="admin-campo">
      {etiqueta}
      <input
        type="file"
        className="admin-input"
        accept="image/*,application/pdf"
        onChange={(e) => {
          const f = e.target.files?.[0] ?? null;
          if (f && f.size > maxArchivoMB * 1024 * 1024) {
            setError(`El archivo pasa de ${maxArchivoMB} MB.`);
            onElegir(null);
            e.target.value = '';
            return;
          }
          setError(null);
          onElegir(f);
        }}
      />
      <span className={error ? 'admin-helper warning' : 'admin-helper'}>
        {error ?? (archivo ? archivo.name : `Foto o PDF, hasta ${maxArchivoMB} MB.`)}
      </span>
    </label>
  );
}
