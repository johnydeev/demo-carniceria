'use client';

import LegalPage from '@/components/legal/LegalPage';
import { terminosCondiciones } from '@/config/legal.config';
import { textoHorario } from '@/lib/horario/texto';
import { useHorario } from '@/demo/hooks';

/**
 * Los terminos citan el horario, que en la demo vive en el store del
 * navegador. Hasta leerlo la pagina queda vacia: mejor que un horario inventado.
 */
export default function TerminosVista() {
  const horario = useHorario();
  if (!horario) return <main className="legal-page" aria-busy="true" />;
  return <LegalPage doc={terminosCondiciones(textoHorario(horario))} />;
}
