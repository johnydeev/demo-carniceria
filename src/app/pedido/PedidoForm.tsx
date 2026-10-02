'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { useCarrito } from '@/components/cart/CartProvider';
import { cantidadItem, direccionEnLinea } from '@/lib/orders/mensaje';
import { subtotal } from '@/lib/cart/cantidades';
import { formatPrice } from '@/lib/productUtils';
import { esCelular } from '@/lib/dispositivo';
import DireccionModal from './DireccionModal';
import type { LineaCarrito } from '@/lib/cart/types';
import type { Perfil } from '@/demo/tipos';

export interface TurnoParaElegir {
  /** ISO: lo que se manda al servidor. */
  inicio: string;
  nombre: string;
}

interface Props {
  lineasIniciales: LineaCarrito[];
  perfil: Perfil;
  retiro: { direccion: string; horarios: string[] };
  turnos: { retiro: TurnoParaElegir[]; envio: TurnoParaElegir[] };
}

export default function PedidoForm({ lineasIniciales, perfil, retiro, turnos }: Props) {
  const router = useRouter();
  const carrito = useCarrito();
  // Hasta que el contexto cargue (y fusione, si venia de un login), se muestra lo que leyo el servidor.
  const lineas = carrito.cargando ? lineasIniciales : carrito.lineas;
  const total = carrito.cargando
    ? lineasIniciales.reduce(
        (a, l) => a + (l.producto?.disponible ? subtotal(l.producto.price, l.quantity, l.producto) : 0),
        0
      )
    : carrito.total;
  const hayNoDisponibles = lineas.some((l) => !l.producto?.disponible);

  // La modalidad no se preselecciona nunca: con "retiro" por defecto, un
  // cliente sin domicilio que queria envio mandaba el pedido sin direccion; con
  // "envio" por defecto si tenia domicilio, el que queria retirar lo mandaba a
  // su casa. Se elige cada vez.
  const [delivery, setDelivery] = useState<'retiro' | 'envio' | null>(null);
  // El turno tampoco se preselecciona. Cambiar de modalidad lo borra: los
  // margenes son distintos y un turno de retiro puede no valer para envio.
  const [turno, setTurno] = useState<string | null>(null);
  const elegirModalidad = (m: 'retiro' | 'envio') => {
    setDelivery(m);
    setTurno(null);
  };
  const turnosDeModalidad = delivery ? turnos[delivery] : [];
  // Despues de un refresh (409 de turno) el elegido puede ya no estar en la lista.
  const turnoVigente = turno && turnosDeModalidad.some((t) => t.inicio === turno) ? turno : null;
  // El metodo de pago tampoco se preselecciona, pero sobrevive a un cambio de
  // modalidad: vale para retiro y para envio, solo cambia el rotulo.
  const [metodo, setMetodo] = useState<'efectivo' | 'transferencia' | null>(null);
  const [form, setForm] = useState({
    customerName: perfil.name,
    customerPhone: perfil.phone,
    address: perfil.address,
    addressNotes: perfil.addressNotes,
    notes: '',
  });
  const [enviando, setEnviando] = useState(false);
  const [editandoDireccion, setEditandoDireccion] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /**
   * El servidor dijo "El carrito está vacío." a un carrito que se veia con
   * productos: lo tipico es un pedido que si se creo pero cuya respuesta no
   * llego (la red se corto, la base tardo) y un segundo envio. Se avisa con el
   * enlace a "Mis pedidos" en vez de dejar al cliente reintentando a ciegas.
   */
  const [posibleCreado, setPosibleCreado] = useState(false);

  const cambiar =
    (clave: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [clave]: e.target.value }));

  // El servidor arma el pedido con lo que hay en la base. Mientras el carrito
  // carga (la fusion al volver del login) o hay un cambio sin guardar, la base
  // no es lo que el cliente ve: el pedido saldria sin esas lineas, y la
  // escritura que llega despues recreaba la fila en el carrito ya vaciado.
  const carritoAlDia = !carrito.cargando && carrito.pendientes.size === 0;
  // Lo primero que falta, para decirlo al lado del boton: un boton apagado
  // sin explicacion parece roto.
  const falta = !carritoAlDia
    ? null
    : lineas.length === 0 || hayNoDisponibles
      ? null
      : delivery === null
        ? 'Elegí si retirás en el local o te lo enviamos.'
        : turnosDeModalidad.length === 0
          ? 'No hay horarios disponibles por ahora.'
          : turnoVigente === null
            ? delivery === 'retiro'
              ? 'Elegí cuándo retirás.'
              : 'Elegí cuándo te lo llevamos.'
            : metodo === null
              ? 'Elegí cómo pagás.'
              : delivery === 'envio' && form.address.trim() === ''
                ? 'Cargá la dirección de entrega.'
                : form.customerName.trim() === ''
                  ? 'Falta tu nombre.'
                  : form.customerPhone.trim() === ''
                    ? 'Falta tu teléfono.'
                    : null;
  const valido =
    carritoAlDia && !carrito.cargaConError && lineas.length > 0 && !hayNoDisponibles && falta === null;

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valido) return;
    setEnviando(true);
    setError(null);
    setPosibleCreado(false);
    // En el celular, dos pasos: este boton crea el pedido y la pagina del
    // pedido tiene el boton que abre la app con un toque real. Abrirla por
    // codigo despues del fetch solo funciona si el servidor responde en unos
    // 5 s, y con la base dormida no llega; un wa.me abierto por codigo, ademas,
    // caia en la pagina intermedia de WhatsApp. En la compu, pestana nueva a
    // wa.me abierta vacia antes del fetch —lo unico que queda dentro del
    // gesto—; si el pedido falla, se cierra.
    const celular = esCelular(navigator.userAgent, navigator.maxTouchPoints);
    const ventana = celular ? null : window.open('', '_blank');
    if (ventana) ventana.opener = null;
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delivery, turnoInicio: turnoVigente, metodoPago: metodo, ...form }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        // Un 409 de turno: el horario elegido vencio o el comercio cerro ese
        // dia. Se recargan los turnos (el servidor los recalcula) y no se toca
        // el carrito. Cualquier otro 409 dice que el carrito real no es el que
        // se ve: se recarga para que aparezca marcado y se pueda quitar.
        if (res.status === 409) {
          if (data.motivo === 'turno') {
            setTurno(null);
            router.refresh();
          } else {
            carrito.recargar();
          }
        }
        // Un 400 de carrito vacio con productos a la vista: el pedido
        // probablemente ya se creo (borra el carrito en la misma transaccion)
        // y la respuesta se perdio. Se recarga el carrito para mostrar el real
        // y se manda a "Mis pedidos" a confirmarlo.
        if (res.status === 400 && data.motivo === 'vacio') {
          setPosibleCreado(true);
          carrito.recargar();
        }
        const lista =
          Array.isArray(data.productos) && data.productos.length > 0 ? ` (${data.productos.join(', ')})` : '';
        throw new Error((data.error || 'No se pudo crear el pedido.') + lista);
      }
      // El pedido borro el carrito en la base, en la misma transaccion. El
      // contexto no se entera solo: `router.push` no remonta el provider y
      // `router.refresh()` conserva el estado de los componentes cliente.
      carrito.vaciar();
      // Si el navegador bloqueo igual la pestana, la pagina del pedido tiene
      // el boton. No se vuelve a intentar alla: una sola apertura automatica.
      if (ventana) ventana.location.href = data.whatsappUrl;
      router.push(`/cuenta/pedidos/${data.number}?nuevo=1`);
      router.refresh();
    } catch (err) {
      ventana?.close();
      setError(err instanceof Error ? err.message : 'No se pudo crear el pedido.');
      setEnviando(false);
    }
  };

  const avisoPosibleCreado = (
    <p className="pedido-error" role="alert">
      No encontramos productos en tu carrito: es posible que tu pedido ya se haya creado. Revisalo en{' '}
      <Link href="/cuenta/pedidos" className="pedido-link">
        Mis pedidos
      </Link>
      .
    </p>
  );

  // La carga del carrito fallo (la fusion al volver del login o la lectura de
  // la base, tipico con Neon dormida): cero lineas no quiere decir vacio. Se
  // avisa y se ofrece reintentar; `cargaConError` sigue en true mientras se
  // reintenta, asi el boton gira aca en vez de saltar a "Cargando…". Va antes
  // que todo lo demas: el formulario no tiene que mostrarse sobre un carrito
  // que no se sabe cual es.
  if (carrito.cargaConError) {
    return (
      <div className="pedido-vacio" role="alert">
        {posibleCreado && avisoPosibleCreado}
        <p>No pudimos cargar tu carrito.</p>
        <button
          type="button"
          className="pedido-reintentar"
          onClick={carrito.recargar}
          disabled={carrito.cargando}
        >
          {carrito.cargando && <Loader2 size={18} className="animate-spin" aria-hidden="true" />}
          {carrito.cargando ? 'Reintentando…' : 'Reintentar'}
        </button>
      </div>
    );
  }

  // Viniendo del login, la base esta vacia hasta que el contexto fusiona el carrito local.
  if (carrito.cargando && lineasIniciales.length === 0) {
    return <p className="pedido-vacio">Cargando tu carrito…</p>;
  }

  // `enviando` sigue en true hasta que la navegacion se completa. Sin esa
  // condicion, vaciar el carrito al crear el pedido mostraria "Tu carrito esta
  // vacio" por un instante, justo despues de confirmar.
  if (!carrito.cargando && lineas.length === 0 && !enviando) {
    return (
      <div className="pedido-vacio">
        {posibleCreado ? avisoPosibleCreado : <p>Tu carrito está vacío.</p>}
        <Link href="/productos" className="pedido-link">
          Ver el catálogo
        </Link>
      </div>
    );
  }

  return (
    <form className="pedido-form" onSubmit={enviar}>
      <section className="pedido-bloque">
        <div className="pedido-bloque-cabecera">
          <h2>Productos</h2>
          <button type="button" className="pedido-editar" onClick={carrito.abrir} disabled={enviando}>
            Editar
          </button>
        </div>
        <ul className="pedido-lineas">
          {lineas.map((l) => (
            <li key={l.productId} className={l.producto?.disponible ? '' : 'no-disponible'}>
              <span>
                {l.producto?.name ?? 'Producto no disponible'}
                {l.producto && (
                  <small>
                    {' '}
                    ×{' '}
                    {cantidadItem({
                      unit: l.producto.unit,
                      isOffer: l.producto.isOffer,
                      packQuantity: l.producto.quantity,
                      quantity: l.quantity,
                      pesoAprox: l.producto.pesoAprox,
                    })}
                  </small>
                )}
              </span>
              <span>{l.producto?.disponible ? formatPrice(subtotal(l.producto.price, l.quantity, l.producto)) : '—'}</span>
            </li>
          ))}
        </ul>
        {hayNoDisponibles && <p className="pedido-error">Quitá los productos no disponibles para continuar.</p>}
      </section>

      <section className="pedido-bloque">
        <h2>Entrega</h2>
        <div className="pedido-opciones">
          <label className={delivery === 'retiro' ? 'activa' : ''}>
            <input type="radio" name="delivery" checked={delivery === 'retiro'} onChange={() => elegirModalidad('retiro')} />
            <span>
              <strong>Retiro en el local</strong>
              <small>{retiro.direccion}</small>
              {retiro.horarios.map((h) => (
                <small key={h}>{h}</small>
              ))}
            </span>
          </label>
          <label className={delivery === 'envio' ? 'activa' : ''}>
            <input type="radio" name="delivery" checked={delivery === 'envio'} onChange={() => elegirModalidad('envio')} />
            <span>
              <strong>Envío a domicilio</strong>
              <small>El costo se acuerda por WhatsApp</small>
            </span>
          </label>
        </div>
        {delivery && (
          <div className="pedido-turnos">
            <h3>{delivery === 'retiro' ? '¿Cuándo retirás?' : '¿Cuándo te lo llevamos?'}</h3>
            {turnosDeModalidad.length === 0 ? (
              <p className="pedido-sin-turnos" role="status">
                No estamos tomando pedidos por ahora. Volvé a intentar más tarde.
              </p>
            ) : (
              <div className="pedido-opciones">
                {turnosDeModalidad.map((t) => (
                  <label key={t.inicio} className={turnoVigente === t.inicio ? 'activa' : ''}>
                    <input
                      type="radio"
                      name="turno"
                      checked={turnoVigente === t.inicio}
                      onChange={() => setTurno(t.inicio)}
                    />
                    <span>
                      <strong>{t.nombre}</strong>
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}
        {delivery && (
          <div className="pedido-pago">
            <h3>¿Cómo pagás?</h3>
            <div className="pedido-opciones">
              <label className={metodo === 'efectivo' ? 'activa' : ''}>
                <input
                  type="radio"
                  name="metodoPago"
                  checked={metodo === 'efectivo'}
                  onChange={() => setMetodo('efectivo')}
                />
                <span>
                  <strong>Efectivo</strong>
                  <small>{delivery === 'retiro' ? 'Al retirar' : 'Al recibir'}</small>
                </span>
              </label>
              <label className={metodo === 'transferencia' ? 'activa' : ''}>
                <input
                  type="radio"
                  name="metodoPago"
                  checked={metodo === 'transferencia'}
                  onChange={() => setMetodo('transferencia')}
                />
                <span>
                  <strong>Transferencia</strong>
                  <small>Te pasamos el total real y los datos por WhatsApp</small>
                </span>
              </label>
            </div>
          </div>
        )}
        {/* La direccion no se edita en linea: se muestra fija y cambia en el
            modal, que la guarda en el perfil. Asi el pedido sale con la
            direccion registrada de la cuenta, no con un texto suelto. */}
        {delivery === 'envio' &&
          (form.address.trim() ? (
            <div className="pedido-direccion">
              <span>{direccionEnLinea(form.address, form.addressNotes)}</span>
              <button type="button" className="pedido-editar" onClick={() => setEditandoDireccion(true)}>
                Editar
              </button>
            </div>
          ) : (
            // Sin direccion el pedido no puede salir: se dice aca, donde se
            // eligio el envio, y no solo al lado del boton de abajo.
            <div className="pedido-aviso-direccion" role="status">
              <p>Para enviarte el pedido necesitamos tu dirección de entrega.</p>
              <button type="button" onClick={() => setEditandoDireccion(true)}>
                Cargar dirección
              </button>
            </div>
          ))}
        {editandoDireccion && (
          <DireccionModal
            inicial={{ address: form.address, addressNotes: form.addressNotes }}
            onCerrar={() => setEditandoDireccion(false)}
            onGuardada={(d) => {
              setForm((f) => ({ ...f, address: d.address, addressNotes: d.addressNotes }));
              setEditandoDireccion(false);
            }}
          />
        )}
      </section>

      <section className="pedido-bloque">
        <h2>Tus datos</h2>
        <div className="pedido-campos">
          <label>
            Nombre
            <input value={form.customerName} onChange={cambiar('customerName')} maxLength={80} required />
          </label>
          <label>
            Teléfono
            <input
              value={form.customerPhone}
              onChange={cambiar('customerPhone')}
              maxLength={30}
              inputMode="tel"
              required
              placeholder="11 1234 5678"
            />
          </label>
          <label>
            Notas para el comercio (opcional)
            <textarea
              value={form.notes}
              onChange={cambiar('notes')}
              maxLength={300}
              rows={3}
              placeholder="Cortes, puntos de cocción, horario…"
            />
          </label>
        </div>
      </section>

      <footer className="pedido-pie">
        <div className="pedido-total">
          <span>Total estimado</span>
          <strong>{formatPrice(total)}</strong>
        </div>
        <p className="pedido-leyenda">
          El total se ajusta al pesar: las piezas se estiman con su peso aproximado y te confirmamos el precio
          real por WhatsApp, junto con el pago y el envío.
        </p>
        {error && (posibleCreado ? avisoPosibleCreado : <p className="pedido-error">{error}</p>)}
        {falta && !error && <p className="pedido-falta">{falta}</p>}
        <button type="submit" className="pedido-enviar" disabled={!valido || enviando}>
          {(enviando || !carritoAlDia) && <Loader2 size={18} className="animate-spin" aria-hidden="true" />}
          {carritoAlDia ? 'Enviar pedido por WhatsApp' : 'Guardando tu carrito…'}
        </button>
      </footer>
    </form>
  );
}
