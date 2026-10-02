'use client';

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { bloquearScroll } from '@/lib/bloquearScroll';

interface Props {
  abierto: boolean;
  titulo: string;
  onCerrar: () => void;
  /**
   * Mientras sube o guarda: ni la X, ni Escape, ni el fondo lo cierran. Como
   * el `Modal` publico: cerrar a mitad de una subida la dejaba terminar igual.
   */
  bloqueado?: boolean;
  children: React.ReactNode;
}

/**
 * Modal del panel. Cierra con la X, Escape y clic afuera; el foco queda
 * adentro mientras esta abierto y el fondo no scrollea.
 */
export default function AdminModal({ abierto, titulo, onCerrar, bloqueado = false, children }: Props) {
  const panel = useRef<HTMLDivElement>(null);
  // onCerrar suele ser una funcion nueva en cada render del padre. Si fuera
  // dependencia del efecto, cada tecla lo volveria a correr y el foco saltaria
  // al primer campo. Se lee por ref y el efecto corre solo al abrir.
  const cerrarRef = useRef(onCerrar);
  const bloqueadoRef = useRef(bloqueado);
  useEffect(() => {
    cerrarRef.current = onCerrar;
    bloqueadoRef.current = bloqueado;
  }, [onCerrar, bloqueado]);
  const cerrar = () => {
    if (!bloqueadoRef.current) cerrarRef.current();
  };

  useEffect(() => {
    if (!abierto) return;
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
    // El primer campo recibe el foco al abrir.
    panel.current?.querySelector<HTMLElement>('input, select, textarea')?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      desbloquear();
    };
  }, [abierto]);

  if (!abierto) return null;

  return (
    <div className="admin-modal-fondo" onClick={cerrar}>
      <div
        ref={panel}
        className="admin-modal"
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="admin-modal-cabecera">
          <h2 className="admin-modal-titulo">{titulo}</h2>
          <button type="button" className="admin-modal-cerrar" onClick={cerrar} disabled={bloqueado} aria-label="Cerrar">
            <X size={20} aria-hidden="true" />
          </button>
        </header>
        <div className="admin-modal-cuerpo">{children}</div>
      </div>
    </div>
  );
}
