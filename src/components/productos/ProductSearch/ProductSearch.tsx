'use client';

import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { ProductSearchProps } from '@/types/product';
import './ProductSearch.css';

const ProductSearch: React.FC<ProductSearchProps> = ({
  onSearch,
  placeholder = 'Buscar productos...',
}) => {
  const [searchValue, setSearchValue] = useState('');

  // Debounced search with useEffect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      onSearch(searchValue);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchValue, onSearch]);

  const handleClear = () => {
    setSearchValue('');
    onSearch('');
  };

  return (
    <div className="product-search-container">
      <div className="product-search-wrapper">
        <div className="product-search-icon">
          <Search size={20} />
        </div>

        <input
          type="text"
          className="product-search-input"
          placeholder={placeholder}
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          aria-label="Buscar productos"
        />

        {searchValue && (
          <button
            className="product-search-clear"
            onClick={handleClear}
            aria-label="Limpiar búsqueda"
            type="button"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {searchValue && (
        <div className="product-search-info">
          Buscando: <strong>{searchValue}</strong>
        </div>
      )}
    </div>
  );
};

export default ProductSearch;
