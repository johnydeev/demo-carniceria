import type { Metadata } from 'next';
import Proximamente from '@/demo/Proximamente';

export const metadata: Metadata = { title: 'Mi cuenta - Carnicería La Esquina' };

// Fase 2: pagina de cliente con el perfil del store; CuentaVista ya compila.
export default function CuentaPage() {
  return (
    <main className="container-sm">
      <Proximamente titulo="Mi cuenta" />
    </main>
  );
}
