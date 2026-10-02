'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2, Store, User } from 'lucide-react';
import { entrarComo } from '@/demo/sesion';
import { rutaInterna } from '@/lib/rutaInterna';
import '../auth.css';

/**
 * Login de la demo: no hay Google. Cada boton elige un usuario de ejemplo y
 * vuelve a donde se queria ir. Navega recargando, asi que el boton queda
 * apagado con spinner hasta que la pagina se va.
 */
function LoginForm() {
  const params = useSearchParams();
  const callbackUrl = rutaInterna(params.get('callbackUrl'));
  const [entrando, setEntrando] = useState<'cliente' | 'duenio' | null>(null);

  const entrar = (rol: 'cliente' | 'duenio') => {
    setEntrando(rol);
    entrarComo(rol, callbackUrl);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Ingresar</h1>
        <p className="auth-muted">
          Es una demo: elegí con qué rol entrar. En tu versión, clientes y dueño entran con su cuenta de Google.
        </p>

        <button type="button" className="auth-google" onClick={() => entrar('cliente')} disabled={entrando !== null}>
          {entrando === 'cliente' ? (
            <Loader2 size={18} className="animate-spin" aria-hidden="true" />
          ) : (
            <User size={18} aria-hidden="true" />
          )}
          Entrar como cliente
        </button>

        <button type="button" className="auth-google" onClick={() => entrar('duenio')} disabled={entrando !== null}>
          {entrando === 'duenio' ? (
            <Loader2 size={18} className="animate-spin" aria-hidden="true" />
          ) : (
            <Store size={18} aria-hidden="true" />
          )}
          Entrar como dueño
        </button>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="auth-page">Cargando...</div>}>
      <LoginForm />
    </Suspense>
  );
}
