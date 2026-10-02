'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import Modal from '@/components/modal/Modal';
import './WhatsAppModal.css';

/** Contacto generico (widget, footer, slide de marca): lo que escribiria un cliente. */
export const TITULO_CONTACTO = 'Así te escribiría un cliente desde el sitio';

export const MENSAJES_CONTACTO = {
  consulta: 'Hola! Tengo una consulta.',
  pedido: 'Hola! Quiero hacer un pedido.',
} as const;

/** Para el pedido (fase 2) y los avisos del panel (fase 3). */
export function tituloWhatsApp(destino: 'carniceria' | 'cliente'): string {
  return `Así le llegaría este mensaje a ${destino === 'carniceria' ? 'la carnicería' : 'el cliente'} por WhatsApp`;
}

export interface MensajeWhatsApp {
  titulo: string;
  mensaje: string;
}

interface ContextoWhatsApp {
  mostrar: (m: MensajeWhatsApp) => void;
}

const Contexto = createContext<ContextoWhatsApp>({ mostrar: () => {} });

export const useWhatsApp = () => useContext(Contexto);

/**
 * En la demo WhatsApp no se abre: todo lo que en la app real va a wa.me
 * muestra este modal con el texto tal cual saldria. Provider global (el Modal
 * va por portal), fuera de cualquier otro modal: en la fase 3 el modal de una
 * accion del panel se cierra y este queda abierto.
 */
export function WhatsAppProvider({ children }: { children: React.ReactNode }) {
  const [actual, setActual] = useState<MensajeWhatsApp | null>(null);
  const mostrar = useCallback((m: MensajeWhatsApp) => setActual(m), []);
  const cerrar = useCallback(() => setActual(null), []);
  const valor = useMemo(() => ({ mostrar }), [mostrar]);

  return (
    <Contexto.Provider value={valor}>
      {children}
      <Modal abierto={actual !== null} titulo={actual?.titulo ?? ''} onCerrar={cerrar}>
        <p className="wa-demo-aviso">En la demo no se abre WhatsApp. Este es el mensaje que se enviaría:</p>
        <pre className="wa-demo-mensaje">{actual?.mensaje}</pre>
        <div className="modal-acciones">
          <button type="button" className="modal-guardar" onClick={cerrar}>
            Entendido
          </button>
        </div>
      </Modal>
    </Contexto.Provider>
  );
}
