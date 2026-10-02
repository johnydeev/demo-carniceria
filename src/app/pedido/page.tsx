import type { Metadata } from 'next';
import Proximamente from '@/demo/Proximamente';

export const metadata: Metadata = { title: 'Hacer pedido - Carnicería La Esquina' };

// Fase 2: pagina de cliente con carrito, perfil y turnos del store; PedidoForm ya compila.
export default function PedidoPage() {
  return (
    <main className="container-sm">
      <Proximamente titulo="Tu pedido" />
    </main>
  );
}
