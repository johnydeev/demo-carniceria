'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { Loader2, X } from 'lucide-react';
import { useCarrito } from './CartProvider';
import AgregarAlCarrito from './AgregarAlCarrito';
import ProductImage from '@/components/ProductImage/ProductImage';
import { formatPrice } from '@/lib/productUtils';
import { esPieza, subtotal } from '@/lib/cart/cantidades';
import './cart.css';
import { bloquearScroll } from '@/lib/bloquearScroll';

/** Panel lateral del carrito. Cierra con la X, Escape y clic afuera; el foco queda adentro. */
export default function CartDrawer() {
  const {
    abierto,
    cerrar,
    lineas,
    total,
    hayNoDisponibles,
    cargando,
    error,
    quitar,
    pendientes,
    cargaFallida,
    cargaConError,
    recargar,
  } = useCarrito();
  const panel = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!abierto) return;
    // Al cerrar, el foco vuelve al boton del carrito (o a "Agregar"): si no,
    // quedaba en <body> y con teclado habia que recorrer la pagina de nuevo.
    const quienAbrio = document.activeElement as HTMLElement | null;
    const FOCO = 'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        cerrar();
        return;
      }
      // Trampa de foco: Tab da la vuelta dentro del panel.
      if (e.key === 'Tab' && panel.current) {
        const focables = Array.from(panel.current.querySelectorAll<HTMLElement>(FOCO));
        if (focables.length === 0) return;
        const primero = focables[0];
        const ultimo = focables[focables.length - 1];
        // Desde el panel mismo (recien abierto) Shift+Tab tambien da la vuelta.
        const enElBorde = document.activeElement === primero || document.activeElement === panel.current;
        if (e.shiftKey && enElBorde) {
          e.preventDefault();
          ultimo.focus();
        } else if (!e.shiftKey && document.activeElement === ultimo) {
          e.preventDefault();
          primero.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    const desbloquear = bloquearScroll();
    panel.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      desbloquear();
      if (quienAbrio?.isConnected) quienAbrio.focus();
    };
  }, [abierto, cerrar]);

  if (!abierto) return null;

  const vacio = lineas.length === 0;

  return (
    <div className="drawer-fondo" onClick={cerrar}>
      <aside
        ref={panel}
        className="drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Tu carrito"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="drawer-cabecera">
          <h2 className="drawer-titulo">Tu carrito</h2>
          <button type="button" className="drawer-cerrar" onClick={cerrar} aria-label="Cerrar carrito">
            <X size={22} aria-hidden="true" />
          </button>
        </header>

        {error && !cargaConError && <p className="drawer-error">{error}</p>}

        {/* Con la carga fallida, cero lineas no es "vacio": no se sabe que hay. */}
        {cargaConError ? (
          <div className="drawer-vacio" role="alert">
            <p>No pudimos cargar tu carrito.</p>
            <button type="button" className="drawer-link inline-flex cursor-pointer items-center gap-2 border-0 bg-transparent disabled:cursor-default disabled:opacity-60" onClick={recargar} disabled={cargando}>
              {cargando && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
              Reintentar
            </button>
          </div>
        ) : cargando && vacio ? (
          <p className="drawer-vacio">Cargando…</p>
        ) : vacio ? (
          <div className="drawer-vacio">
            <p>Todavía no agregaste nada.</p>
            <Link href="/productos" className="drawer-link" onClick={cerrar}>
              Ver el catálogo
            </Link>
          </div>
        ) : (
          <ul className="drawer-lista">
            {lineas.map((l) => (
              <li
                key={l.productId}
                className={`drawer-linea ${l.producto?.disponible ? '' : 'no-disponible'}`}
              >
                <div className="drawer-foto">
                  {l.producto && (
                    <ProductImage
                      publicId={l.producto.imagePublicId || l.producto.imageUrl || undefined}
                      alt={l.producto.name}
                      width={120}
                      height={90}
                      // .drawer-foto mide 72 px: con el sizes del catalogo bajaba la de 720.
                      sizes="72px"
                    />
                  )}
                </div>
                <div className="drawer-datos">
                  <p className="drawer-nombre">{l.producto?.name ?? 'Producto no disponible'}</p>
                  {l.producto?.disponible ? (
                    <>
                      <AgregarAlCarrito producto={l.producto} compacto modo="stepper" />
                      <p className="drawer-subtotal">
                        {formatPrice(subtotal(l.producto.price, l.quantity, l.producto))}
                        {esPieza(l.producto) && <small className="drawer-estimado"> aprox.</small>}
                      </p>
                    </>
                  ) : (
                    <p className="drawer-aviso">{cargaFallida ? 'No se pudo cargar' : 'Ya no está disponible'}</p>
                  )}
                </div>
                <button
                  type="button"
                  className="drawer-quitar"
                  onClick={() => quitar(l.productId)}
                  disabled={pendientes.has(l.productId) || cargando}
                  aria-label="Quitar"
                >
                  {pendientes.has(l.productId) ? (
                    <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                  ) : (
                    <X size={16} aria-hidden="true" />
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}

        {!vacio && !cargaConError && (
          <footer className="drawer-pie">
            <div className="drawer-total">
              <span>Total estimado</span>
              <strong>{formatPrice(total)}</strong>
            </div>
            <p className="drawer-leyenda">
              {lineas.some((l) => l.producto && esPieza(l.producto))
                ? 'El total se ajusta al pesar. Las piezas se estiman por su peso aproximado: te confirmamos el precio por WhatsApp.'
                : 'El total se ajusta al pesar.'}
            </p>
            {hayNoDisponibles && (
              <p className="drawer-error">Quitá los productos no disponibles para continuar.</p>
            )}
            <Link
              href="/pedido"
              className={`drawer-pedir ${hayNoDisponibles ? 'deshabilitado' : ''}`}
              aria-disabled={hayNoDisponibles}
              onClick={(e) => {
                if (hayNoDisponibles) e.preventDefault();
                else cerrar();
              }}
            >
              Hacer pedido
            </Link>
          </footer>
        )}
      </aside>
    </div>
  );
}
