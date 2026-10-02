'use client';

import React from 'react';
import { ProductCardProps } from '@/types/product';
import { formatPrice } from '@/lib/productUtils';
import { PRODUCT_CARD_IMAGE_SIZE } from '@/lib/productImageProcessor';
import ProductImage from '@/components/ProductImage/ProductImage';
import AgregarAlCarrito from '@/components/cart/AgregarAlCarrito';
import type { ProductoCarrito } from '@/lib/cart/types';
import './ProductCard.css';
import { nombreRubro } from '@/lib/productCategories';

const ProductCard: React.FC<ProductCardProps> = ({ product, onClick }) => {

  /**
   * LOG DE DEBUG
   * Se mantiene para verificar qué llega realmente desde Google Sheets.
   * Confirmamos que "Imagen" puede venir como string vacío.
   * Este log debería eliminarse en producción.
   */
  /**
   * Normalización defensiva del campo Imagen
   *
   * Motivo:
   * - Desde Google Sheets el campo puede venir como:
   *   - string vacío ""
   *   - null / undefined
   *   - con espacios
   *
   * Esta normalización NO inventa datos,
   * solo garantiza que ProductImage reciba siempre un string válido.
   */
  const normalizedImage = typeof product.Imagen === 'string'
    ? product.Imagen.trim()
    : '';

  // Solo si la card trae las claves nuevas del catalogo; las vistas viejas no las tienen.
  const productoCarrito: ProductoCarrito | null =
    product.Id && product.TipoUnidad && product.PrecioNumero !== undefined
      ? {
          id: product.Id,
          name: product.Nombre,
          price: product.PrecioNumero,
          unit: product.TipoUnidad,
          quantity: product.Cantidad ?? 1,
          isOffer: Boolean(product.EsOferta),
          pesoAprox: product.PesoAprox ?? null,
          imagePublicId: normalizedImage || null,
          imageUrl: null,
          disponible: product.PrecioNumero > 0,
        }
      : null;

  return (
    <article
      className="product-card"
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {/* Imagen del producto */}
      <div className="product-image-container">
        <ProductImage
          /**
           * Se pasa la imagen normalizada
           * Evita pasar undefined / null / strings con espacios
           */
          publicId={normalizedImage}
          width={PRODUCT_CARD_IMAGE_SIZE.width}
          height={PRODUCT_CARD_IMAGE_SIZE.height}

          /**
           * Fallback defensivo para accesibilidad
           */
          alt={product.Nombre || 'Producto'}
        />

        {/* Badge de categoría */}
        {product.Categoría && (
          <span className="product-category-badge">
            {nombreRubro(product.Categoría)}
          </span>
        )}

        {/* Oferta abajo a la derecha de la foto, como en la fila del inicio. */}
        {product.EsOferta && (
          <span className="product-offer-badge">Oferta</span>
        )}

        {/* Badge de stock */}
        {product.Stock && product.Stock.toLowerCase() !== 'disponible' && (
          <span
            className={`product-stock-badge ${product.Stock.toLowerCase() === 'agotado' ? 'out-of-stock' : ''
              }`}
          >
            {product.Stock}
          </span>
        )}
      </div>

      {/* Contenido del producto */}
      <div className="product-content">
        <h3 className="product-name" title={product.Nombre}>
          {product.Nombre}
        </h3>

        {product.Descripción && (
          <p
            className="product-description"
            title={product.Descripción}
          >
            {product.Descripción}
          </p>
        )}

        <div className="product-footer">
          <span className="product-price">
            {formatPrice(product.Precio)}
            {product.Unidad && (
              <span className="product-unit"> {product.Unidad}</span>
            )}
          </span>
          {product.PrecioUnitario && (
            <span className="product-unit-price">{product.PrecioUnitario}</span>
          )}
          {product.Pieza && <span className="product-unit-price">{product.Pieza}</span>}
          {productoCarrito && (
            <div className="product-agregar">
              <AgregarAlCarrito producto={productoCarrito} />
            </div>
          )}
        </div>
      </div>
    </article>
  );
};

export default ProductCard;
