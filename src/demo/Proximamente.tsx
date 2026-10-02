import Link from 'next/link';
import './Proximamente.css';

/**
 * Lugar de las pantallas que llegan en la fase 2 (pedido y cuenta) y en la
 * fase 3 (panel). Sus componentes reales siguen en el arbol y compilan
 * (`PaginaPanel.tsx`, `PedidoForm`, `CuentaVista`...); la ruta muestra esto
 * hasta que existan sus handlers, para que la demo publicada no muestre
 * pantallas que piden datos que nadie atiende.
 */
export default function Proximamente({ titulo }: { titulo: string }) {
  return (
    <section className="proximamente">
      <h1 className="section-title">{titulo}</h1>
      <p className="proximamente-texto">Disponible próximamente en la demo.</p>
      <Link href="/productos" className="proximamente-enlace">
        Ver el catálogo
      </Link>
    </section>
  );
}
