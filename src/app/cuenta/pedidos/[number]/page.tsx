import type { Metadata } from 'next';
import Proximamente from '@/demo/Proximamente';

export const metadata: Metadata = { title: 'Pedido - Carnicería La Esquina' };

// Fase 2: detalle del pedido con el ticket en VerArchivoModal.
export default function PedidoDetallePage() {
  return (
    <main className="container-sm">
      <Proximamente titulo="Pedido" />
    </main>
  );
}
