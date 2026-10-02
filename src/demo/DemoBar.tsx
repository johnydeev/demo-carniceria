'use client';

import { useState, useSyncExternalStore } from 'react';
import { Loader2, RotateCcw } from 'lucide-react';
import { entrarComo, useRolDemo } from './sesion';
import { avisoDemo, reiniciar, suscribir, type AvisoDemo } from './store';
import { esRol, NOMBRE_ROL, ROLES } from './sesionActual';
import './DemoBar.css';

const TEXTO_AVISO = {
  regenerada: 'La demo se reinició con datos de hoy.',
  sinAlmacenamiento: 'Tu navegador no deja guardar datos: lo que hagas se pierde al recargar.',
} as const;

const sinAvisoEnElServidor = () => null;

/**
 * Barra fina arriba de todo: dice que es una demo, deja elegir con que rol
 * mirarla y reiniciarla. Cambiar de rol y reiniciar recargan la pagina, asi
 * que los dos controles quedan apagados con spinner hasta que navega.
 */
export default function DemoBar() {
  const rol = useRolDemo();
  const aviso = useSyncExternalStore<AvisoDemo | null>(suscribir, avisoDemo, sinAvisoEnElServidor);
  const [ocupado, setOcupado] = useState<'rol' | 'reinicio' | null>(null);

  const cambiarRol = (valor: string) => {
    if (!esRol(valor) || valor === rol) return;
    setOcupado('rol');
    entrarComo(valor, `${window.location.pathname}${window.location.search}`);
  };

  const reiniciarDemo = () => {
    if (!window.confirm('¿Volver la demo al estado inicial? Se pierde lo que cambiaste.')) return;
    setOcupado('reinicio');
    reiniciar();
    window.location.reload();
  };

  return (
    <>
      <div className="demo-barra" role="region" aria-label="Controles de la demo">
        <span className="demo-barra-marca">Demo</span>
        <label className="demo-barra-rol">
          <span>Estás viendo como:</span>
          <select
            value={rol ?? ''}
            onChange={(e) => cambiarRol(e.target.value)}
            disabled={rol === null || ocupado !== null}
            aria-label="Estás viendo como"
          >
            {rol === null && <option value="">…</option>}
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {NOMBRE_ROL[r]}
              </option>
            ))}
          </select>
          {ocupado === 'rol' && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
        </label>
        <button type="button" className="demo-barra-reiniciar" onClick={reiniciarDemo} disabled={ocupado !== null}>
          {ocupado === 'reinicio' ? (
            <Loader2 size={14} className="animate-spin" aria-hidden="true" />
          ) : (
            <RotateCcw size={14} aria-hidden="true" />
          )}
          Reiniciar demo
        </button>
      </div>
      {aviso && (
        <p className="demo-aviso" role="status">
          {TEXTO_AVISO[aviso]}
        </p>
      )}
    </>
  );
}
