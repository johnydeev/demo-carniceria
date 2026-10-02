'use client';

import { useSyncExternalStore } from 'react';
import { esCelular } from '@/lib/dispositivo';

interface Props {
  /** https://wa.me/...: WhatsApp Web o la app de escritorio; en el celular, respaldo. */
  urlWeb: string;
  /** whatsapp://send?...: abre la app instalada directo. */
  urlApp: string;
  texto: string;
}

const nada = () => () => {};
const leerCelular = () => esCelular(navigator.userAgent, navigator.maxTouchPoints);
// En el servidor no hay navigator: se dibuja la version de escritorio y el
// cliente la corrige al hidratar, sin desajuste de HTML.
const enServidor = () => false;

/**
 * El boton que manda el pedido por WhatsApp. En el celular es un enlace a
 * `whatsapp://` tocado por el cliente: un toque real es lo unico que abre la
 * app de forma confiable. Abrirla por codigo despues de crear el pedido
 * dependia de que el servidor respondiera en menos de unos 5 s —el tiempo que
 * el navegador considera "recien tocado"— y con la base dormida no llegaba.
 * Debajo, `wa.me` por si la app no esta instalada.
 */
export default function BotonWhatsApp({ urlWeb, urlApp, texto }: Props) {
  const celular = useSyncExternalStore(nada, leerCelular, enServidor);

  if (celular) {
    return (
      <>
        <a href={urlApp} className="pedido-whatsapp">
          {texto}
        </a>
        <a href={urlWeb} target="_blank" rel="noopener noreferrer" className="pedido-whatsapp-alt">
          ¿No se abre? Probá desde la web de WhatsApp
        </a>
      </>
    );
  }

  return (
    <a href={urlWeb} target="_blank" rel="noopener noreferrer" className="pedido-whatsapp">
      {texto}
    </a>
  );
}
