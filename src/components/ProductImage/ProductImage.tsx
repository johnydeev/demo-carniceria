'use client';

import { useMemo, useState } from 'react';
import { ProductImageProps } from '@/types/productImage';
import { PRODUCT_CARD_IMAGE_SIZE, PRODUCT_CARD_SIZES } from '@/lib/productImageProcessor';
import { fuenteDeImagen } from '@/demo/imagenLocal';
import './ProductImage.css';

type Props = ProductImageProps & {
  /**
   * Cuanto ocupa la imagen en pantalla, para que el navegador elija el ancho
   * del srcset. Por defecto, el de la card del catalogo. Quien la dibuje mas
   * chica (la miniatura del carrito, la fila del inicio) pasa el suyo, o el
   * celular baja la version de 720 para mostrarla a 72 px.
   */
  sizes?: string;
};

/**
 * En la demo no hay Cloudinary ni Drive: las fotos son rutas de /public o data
 * URL. La decision vive en `fuenteDeImagen` (src/demo/imagenLocal.ts), pura y
 * con tests; el resto del componente es el de la app real.
 */
const ProductImage: React.FC<Props> = ({
  publicId,
  alt,
  width = PRODUCT_CARD_IMAGE_SIZE.width,
  height = PRODUCT_CARD_IMAGE_SIZE.height,
  className = '',
  priority = false,
  sizes = PRODUCT_CARD_SIZES,
}) => {
  const [errorUrl, setErrorUrl] = useState<string | null>(null);
  // Misma idea que errorUrl: se guarda la URL que cargo, no un booleano, asi
  // un cambio de src vuelve al estado "cargando" sin un efecto de reset.
  const [loadedUrl, setLoadedUrl] = useState<string | null>(null);

  const imageData = useMemo(() => fuenteDeImagen(publicId), [publicId]);

  const hasError = errorUrl === imageData.url;
  const loaded = loadedUrl === imageData.url;

  if (hasError || !imageData.url) {
    return (
      <div className={`product-image-placeholder ${className}`}>
        <svg
          width="80"
          height="80"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--color-muted)"
          strokeWidth="1.5"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
        <span>Sin imagen</span>
      </div>
    );
  }

  return (
    <div className="product-image-wrapper">
      {!loaded && <div className="product-image-loading-skeleton" aria-hidden="true" />}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        // Si la imagen ya estaba completa antes de hidratar (cache o SSR
        // rapido), onLoad no vuelve a dispararse: el ref lo cubre.
        ref={(el) => {
          if (el?.complete && el.naturalWidth > 0) setLoadedUrl(imageData.url);
        }}
        src={imageData.url}
        srcSet={imageData.srcSet}
        sizes={imageData.srcSet ? sizes : undefined}
        alt={alt}
        width={width}
        height={height}
        className={`product-image ${loaded ? 'is-loaded' : ''} ${className}`}
        loading={priority ? 'eager' : 'lazy'}
        style={{ objectFit: 'cover' }}
        onLoad={() => setLoadedUrl(imageData.url)}
        onError={() => {
          setErrorUrl(imageData.url);
        }}
      />
    </div>
  );
};

export default ProductImage;
