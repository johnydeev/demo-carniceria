'use client';

import { useEffect } from 'react';
import { arrancarDemo } from './msw';

/**
 * Arranca la API simulada una vez por carga de pagina. No dibuja nada. Va en el
 * layout raiz: importar `./msw` desde aca hace que su envoltorio de `fetch` se
 * instale antes de que hidrate cualquier componente.
 */
export default function DemoArranque() {
  useEffect(() => {
    void arrancarDemo();
  }, []);
  return null;
}
