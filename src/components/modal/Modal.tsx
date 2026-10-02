'use client';

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { bloquearScroll } from '@/lib/bloquearScroll';
import './Modal.css';

interface Props {
  abierto: boolean;
  titulo: string;
  onCerrar: () => void;
  /** Mientras guarda: la X, Escape y el fondo no cierran. Cerrar a mitad de un guardado lo dejaba terminar igual. */
  bloqueado?: boolean;
  children: React.ReactNode;
}

/**
 * Modal del sitio publico. Cierra con la X, Escape y clic afuera; el foco
 * queda adentro mientras esta abierto y el fondo no scrollea. Es el mismo
 * comportamiento que AdminModal, con los tokens del sitio en vez de los del
 * panel.
 *
 * Se dibuja en `document.body` con un portal: suele abrirse desde adentro de
 * otro formulario (el de /pedido), y un <form> anidado no existe en HTML —el
 * navegador lo descarta y "Guardar" enviaria el formulario de afuera—.
 */
export default function Modal({ abierto, titulo, onCerrar, bloqueado = false, children }: Props) {
  const panel = useRef<HTMLDivElement>(null);
  // onCerrar suele ser una funcion nueva en cada render del padre: si fuera
  // dependencia del efecto, cada tecla lo volveria a correr y el foco saltaria
  // al primer campo (la trampa que tuvo AdminModal). Se lee por ref.
  const cerrarRef = useRef(onCerrar);
  const bloqueadoRef = useRef(bloqueado);
  useEffect(() => {
    cerrarRef.current = onCerrar;
    bloqueadoRef.current = bloqueado;
  }, [onCerrar, bloqueado]);
  /** Donde empezo el mousedown: arrastrar desde un input y soltar sobre el fondo no es un clic afuera. */
  const presionEnFondo = useRef(false);
  const cerrar = () => {
    if (!bloqueadoRef.current) cerrarRef.current();
  };

  useEffect(() => {
    if (!abierto) return;
    // El foco vuelve al boton que abrio el modal: si no, queda en <body> y
    // con teclado hay que recorrer la pagina de nuevo.
    const quienAbrio = document.activeElement as HTMLElement | null;
    const cerrar = () => {
      if (!bloqueadoRef.current) cerrarRef.current();
    };
    const FOCO = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        cerrar();
        return;
      }
      if (e.key === 'Tab' && panel.current) {
        const focables = Array.from(panel.current.querySelectorAll<HTMLElement>(FOCO));
        if (focables.length === 0) return;
        const primero = focables[0];
        const ultimo = focables[focables.length - 1];
        if (e.shiftKey && document.activeElement === primero) {
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
    panel.current?.querySelector<HTMLElement>('input, select, textarea')?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      desbloquear();
      // Si el boton que lo abrio ya no existe ("Cargar" se vuelve "Editar"), no se fuerza nada.
      if (quienAbrio?.isConnected) quienAbrio.focus();
    };
  }, [abierto]);

  if (!abierto) return null;

  return createPortal(
    <div
      className="modal-fondo"
      onMouseDown={(e) => {
        presionEnFondo.current = e.target === e.currentTarget;
      }}
      onClick={(e) => {
        if (presionEnFondo.current && e.target === e.currentTarget) cerrar();
        presionEnFondo.current = false;
      }}
    >
      <div
        ref={panel}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
      >
        <header className="modal-cabecera">
          <h2 className="modal-titulo">{titulo}</h2>
          <button type="button" className="modal-cerrar" onClick={cerrar} disabled={bloqueado} aria-label="Cerrar">
            <X size={20} aria-hidden="true" />
          </button>
        </header>
        <div className="modal-cuerpo">{children}</div>
      </div>
    </div>,
    document.body
  );
}
