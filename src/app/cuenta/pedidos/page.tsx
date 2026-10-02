import type { Metadata } from 'next';
import Proximamente from '@/demo/Proximamente';

export const metadata: Metadata = { title: 'Mis pedidos - Carnicería La Esquina' };

// Fase 2.
export default function MisPedidosPage() {
  return (
    <main className="container-sm">
      <Proximamente titulo="Mis pedidos" />
    </main>
  );
}
