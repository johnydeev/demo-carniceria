'use client';

import { useEffect, useState } from 'react';
import { MENSAJES_CONTACTO, TITULO_CONTACTO, useWhatsApp } from '@/demo/WhatsAppModal';
import '@components/features/whatsAppWidget/WhatsAppWidget.css';

const APARECE_MS = 3000;
const SE_VA_MS = 6000;

/**
 * Un solo mensaje, una sola vez. En la demo no abre wa.me: muestra el modal
 * con lo que escribiria un cliente.
 */
const WhatsAppWidget = () => {
  const [mostrarMensaje, setMostrarMensaje] = useState(false);
  const { mostrar } = useWhatsApp();

  useEffect(() => {
    const aparece = setTimeout(() => setMostrarMensaje(true), APARECE_MS);
    const seVa = setTimeout(() => setMostrarMensaje(false), APARECE_MS + SE_VA_MS);
    return () => {
      clearTimeout(aparece);
      clearTimeout(seVa);
    };
  }, []);

  const abrir = () => {
    setMostrarMensaje(false);
    mostrar({ titulo: TITULO_CONTACTO, mensaje: MENSAJES_CONTACTO.consulta });
  };

  return (
    <div className="whatsapp-widget">
      {mostrarMensaje && (
        <div className="whatsapp-message" role="status">
          <button type="button" className="whatsapp-message-texto" onClick={abrir}>
            ¿Consultas? Escribinos por WhatsApp.
          </button>
          <button
            type="button"
            className="whatsapp-message-close"
            onClick={() => setMostrarMensaje(false)}
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>
      )}
      <button type="button" className="whatsapp-button" onClick={abrir} aria-label="Escribinos por WhatsApp">
        <svg viewBox="0 0 32 32" width="30" height="30" aria-hidden="true" fill="#fff">
          <path d="M16 3C9.4 3 4 8.3 4 14.9c0 2.4.7 4.7 2 6.6L4.3 28l6.7-1.7c1.6.8 3.3 1.3 5 1.3 6.6 0 12-5.3 12-11.9S22.6 3 16 3zm0 21.6c-1.6 0-3.1-.4-4.5-1.2l-.3-.2-3.9 1 1-3.8-.2-.3A9.6 9.6 0 0 1 6.4 15c0-5.3 4.3-9.6 9.6-9.6s9.6 4.3 9.6 9.6-4.3 9.6-9.6 9.6zm5.3-7.2c-.3-.1-1.7-.8-2-.9-.3-.1-.5-.1-.7.1-.2.3-.8.9-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.2-.5-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.4.1-.6l.4-.5.3-.5c.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5 2.5 1 3 .8 3.6.8.6-.1 1.7-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.2-.3-.3-.6-.4z" />
        </svg>
      </button>
    </div>
  );
};

export default WhatsAppWidget;
