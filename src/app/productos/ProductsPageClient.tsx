'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { productsConfig } from '@/config/products.config';
import { filterProducts, paginateProducts, calculateTotalPages } from '@/lib/productUtils';
import { toCatalogProducts } from '@/lib/catalog/present';
import { useCatalogo } from '@/demo/hooks';
import ProductSearch from '@/components/productos/ProductSearch/ProductSearch';
import ProductGrid from '@/components/productos/ProductGrid/ProductGrid';
import Pagination from '@/components/productos/Pagination/Pagination';

interface ProductsPageClientProps {
  /** Rubro como en la base ("Carniceria"); sin rubro, todo el catalogo. */
  categoria?: string;
}

/**
 * En la app real recibe los productos del Server Component. En la demo los lee
 * del store con `useCatalogo` y muestra el esqueleto de la grilla hasta
 * hidratar.
 */
const ProductsPageClient: React.FC<ProductsPageClientProps> = ({ categoria }) => {
  const items = useCatalogo(categoria);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const initialProducts = useMemo(() => (items ? toCatalogProducts(items) : []), [items]);

  // Filtrar productos según término de búsqueda
  const filteredProducts = useMemo(() => {
    return filterProducts(initialProducts, searchTerm);
  }, [initialProducts, searchTerm]);

  // Calcular páginas totales
  const totalPages = useMemo(() => {
    return calculateTotalPages(filteredProducts.length, productsConfig.itemsPerPage);
  }, [filteredProducts.length]);

  // Paginar productos filtrados
  const paginatedProducts = useMemo(() => {
    return paginateProducts(filteredProducts, currentPage, productsConfig.itemsPerPage);
  }, [filteredProducts, currentPage]);

  // Va con useCallback a proposito: ProductSearch tiene onSearch en las
  // dependencias de su useEffect. Sin memoizar, cada render creaba una funcion
  // nueva, el efecto se volvia a ejecutar y a los 300 ms disparaba onSearch('')
  // que reseteaba la pagina. Resultado: al cambiar de pagina volvias a la 1.
  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  if (items === null) {
    return (
      <div className="productos-content">
        <ProductGrid products={[]} loading />
      </div>
    );
  }

  if (initialProducts.length === 0) {
    return (
      <div className="productos-empty-state">
        <div className="productos-empty-content">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="80"
            height="80"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
          </svg>
          <h2>No hay productos disponibles</h2>
          <p>Estamos trabajando en actualizar nuestro catálogo. Vuelve pronto.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="productos-content">
      <ProductSearch
        onSearch={handleSearch}
        placeholder="Buscar por nombre, categoría..."
      />

      <ProductGrid products={paginatedProducts} />

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        itemsPerPage={productsConfig.itemsPerPage}
        totalItems={filteredProducts.length}
      />
    </div>
  );
};

export default ProductsPageClient;
