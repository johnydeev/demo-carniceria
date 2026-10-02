'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { PaginationProps } from '@/types/product';
import './Pagination.css';

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage,
  totalItems,
}) => {
  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Generar números de página a mostrar
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      // Mostrar todas las páginas
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Siempre mostrar primera página
      pages.push(1);

      if (currentPage > 3) {
        pages.push('...');
      }

      // Páginas alrededor de la actual
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push('...');
      }

      // Siempre mostrar última página
      pages.push(totalPages);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  const handlePageClick = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page);
      // Scroll suave al inicio de la lista de productos
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="pagination-container">
      {/* Contador de items */}
      <div className="pagination-info">
        Mostrando <strong>{startItem}</strong> - <strong>{endItem}</strong> de{' '}
        <strong>{totalItems}</strong> productos
      </div>

      {/* Controles de paginación */}
      <nav className="pagination-nav" aria-label="Paginación de productos">
        {/* Primera página */}
        <button
          className="pagination-button pagination-nav-button"
          onClick={() => handlePageClick(1)}
          disabled={currentPage === 1}
          aria-label="Primera página"
          title="Primera página"
        >
          <ChevronsLeft size={18} />
        </button>

        {/* Página anterior */}
        <button
          className="pagination-button pagination-nav-button"
          onClick={() => handlePageClick(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Página anterior"
          title="Página anterior"
        >
          <ChevronLeft size={18} />
        </button>

        {/* Números de página */}
        <div className="pagination-numbers">
          {pageNumbers.map((page, index) => {
            if (page === '...') {
              return (
                <span key={`ellipsis-${index}`} className="pagination-ellipsis">
                  ...
                </span>
              );
            }

            return (
              <button
                key={page}
                className={`pagination-button pagination-number ${
                  currentPage === page ? 'active' : ''
                }`}
                onClick={() => handlePageClick(page as number)}
                aria-label={`Página ${page}`}
                aria-current={currentPage === page ? 'page' : undefined}
              >
                {page}
              </button>
            );
          })}
        </div>

        {/* Página siguiente */}
        <button
          className="pagination-button pagination-nav-button"
          onClick={() => handlePageClick(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Página siguiente"
          title="Página siguiente"
        >
          <ChevronRight size={18} />
        </button>

        {/* Última página */}
        <button
          className="pagination-button pagination-nav-button"
          onClick={() => handlePageClick(totalPages)}
          disabled={currentPage === totalPages}
          aria-label="Última página"
          title="Última página"
        >
          <ChevronsRight size={18} />
        </button>
      </nav>
    </div>
  );
};

export default Pagination;
