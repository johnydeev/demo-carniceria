'use client';

import React from 'react';
import { ProductGridProps } from '@/types/product';
import ProductCard from '../ProductCard/ProductCard';
import './ProductGrid.css';

const ProductGrid: React.FC<ProductGridProps> = ({ products, loading = false }) => {

  if (loading) {
    return (
      <div className="product-grid-container">
        <div className="product-grid">
          {Array.from({ length: 12 }).map((_, index) => (
            <div key={index} className="product-card-skeleton">
              <div className="skeleton-image"></div>
              <div className="skeleton-content">
                <div className="skeleton-line skeleton-title"></div>
                <div className="skeleton-line skeleton-description"></div>
                <div className="skeleton-line skeleton-price"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="product-grid-container">
        <div className="product-grid-empty">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <h3>No se encontraron productos</h3>
          <p>Intenta con otros términos de búsqueda</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="product-grid-container">
      <div className="product-grid">
        {products.map((product, index) => (
          <ProductCard key={`${product.Nombre}-${index}`} product={product} />
        ))}
      </div>
    </div>
  );
};

export default ProductGrid;
