'use client';

import { Loader2, Minus, Plus } from 'lucide-react';
import { useCarrito } from './CartProvider';
import { formatearCantidad, minimo, paso } from '@/lib/cart/cantidades';
import type { ProductoCarrito } from '@/lib/cart/types';
import './cart.css';

interface Props {
  producto: ProductoCarrito;
  /** Version chica para la fila del hero y el drawer. */
  compacto?: boolean;
  /**
   * 'boton': siempre "Agregar" (catalogo y home); si ya esta en el carrito
   * suma un paso. El stepper vive solo en el panel lateral ('stepper').
   */
  modo?: 'boton' | 'stepper';
}

export default function AgregarAlCarrito({ producto, compacto = false, modo = 'boton' }: Props) {
  const { cantidadDe, poner, pendientes, abrir, cargando } = useCarrito();
  const cantidad = cantidadDe(producto.id);
  const ocupado = pendientes.has(producto.id);
  // Mientras el carrito carga, una escritura pisaria la carga: el provider la ignora y el boton se apaga.
  const apagado = ocupado || cargando;
  const s = paso(producto);

  const detener = (e: React.MouseEvent) => {
    // La card entera puede tener onClick: el boton no debe dispararlo.
    e.stopPropagation();
    e.preventDefault();
  };

  if (!producto.disponible) return null;

  if (modo === 'boton' || cantidad === 0) {
    return (
      <button
        type="button"
        className={`agregar-btn ${compacto ? 'compacto' : ''}`}
        disabled={apagado}
        onClick={(e) => {
          detener(e);
          // Primera vez: el minimo. Si ya estaba: un paso mas. Y se abre el panel, que es donde se ajusta.
          poner(producto.id, cantidad === 0 ? minimo(producto) : cantidad + s, producto);
          abrir();
        }}
        aria-label={`Agregar ${producto.name} al carrito`}
      >
        {ocupado ? (
          <Loader2 size={16} className="animate-spin" aria-hidden="true" />
        ) : (
          <Plus size={16} aria-hidden="true" />
        )}
        Agregar
      </button>
    );
  }

  return (
    <div
      className={`stepper ${compacto ? 'compacto' : ''}`}
      role="group"
      aria-label={`Cantidad de ${producto.name}`}
    >
      <button
        type="button"
        className="stepper-btn"
        disabled={apagado}
        onClick={(e) => {
          detener(e);
          poner(producto.id, cantidad - s, producto);
        }}
        aria-label={cantidad - s < minimo(producto) ? 'Quitar del carrito' : 'Restar'}
      >
        {ocupado ? (
          <Loader2 size={14} className="animate-spin" aria-hidden="true" />
        ) : (
          <Minus size={14} aria-hidden="true" />
        )}
      </button>
      <span className="stepper-cantidad" aria-live="polite">
        {formatearCantidad(cantidad, producto)}
      </span>
      <button
        type="button"
        className="stepper-btn"
        disabled={apagado}
        onClick={(e) => {
          detener(e);
          poner(producto.id, cantidad + s, producto);
        }}
        aria-label="Sumar"
      >
        {ocupado ? (
          <Loader2 size={14} className="animate-spin" aria-hidden="true" />
        ) : (
          <Plus size={14} aria-hidden="true" />
        )}
      </button>
    </div>
  );
}
