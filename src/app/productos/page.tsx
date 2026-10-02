import type { Metadata } from 'next';
import { negocio } from '@/config/negocio.config';
import ProductsPageClient from './ProductsPageClient';
import './productos.css';

export const metadata: Metadata = {
  title: `Productos - ${negocio.nombre}`,
  description: 'Catálogo de ejemplo: carnes, pollo, fiambres y almacén con precios.',
};

/** Pagina de servidor fina: los productos los lee ProductsPageClient del store. */
export default function ProductosPage() {
  return (
    <main className="productos-page">
      <header className="productos-header">
        <div className="productos-header-content">
          <h1 className="productos-title">Nuestros Productos</h1>
          <p className="productos-subtitle">
            Cortes, pollo, fiambres y almacén de la carnicería del barrio
          </p>
        </div>
      </header>
      <ProductsPageClient />
    </main>
  );
}
