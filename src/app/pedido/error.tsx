'use client';

import { useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import './pedido.css';

/**
 * Si falla el render del servidor de /pedido (Neon dormida al volver del
 * login: lee el carrito, el perfil y el horario), sin esto la pagina se
 * rompia. El aviso de `PedidoForm` solo cubre la carga del navegador.
 *
 * "Reintentar" vuelve a pedir la pagina al servidor (`router.refresh()`) y
 * limpia el error (`reset()`) en la misma transicion: `reset()` solo
 * re-renderiza en el navegador y volveria a mostrar el mismo error.
 */
export default function ErrorPedido({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const router = useRouter();
  const [reintentando, startTransition] = useTransition();

  useEffect(() => {
    console.error('[pedido] no se pudo armar la pagina:', error);
  }, [error]);

  const reintentar = () => {
    startTransition(() => {
      router.refresh();
      reset();
    });
  };

  return (
    <main className="pedido-page container-sm">
      <h1 className="section-title">Tu pedido</h1>
      <div className="pedido-vacio" role="alert">
        <p>No pudimos cargar tu pedido. Puede ser un momento: probá de nuevo.</p>
        <button type="button" className="pedido-reintentar" onClick={reintentar} disabled={reintentando}>
          {reintentando && <Loader2 size={18} className="animate-spin" aria-hidden="true" />}
          {reintentando ? 'Reintentando…' : 'Reintentar'}
        </button>
      </div>
    </main>
  );
}
