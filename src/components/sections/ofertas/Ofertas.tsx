import Link from 'next/link';
import type { CatalogItem } from '@/lib/catalog/types';
import { formatPrice } from '@/lib/productUtils';
import { formatUnitLabel, formatUnitPrice, formatPieza } from '@/lib/catalog/format';
import ProductImage from '@/components/ProductImage/ProductImage';
import { nombreRubro } from '@/lib/productCategories';
import './Ofertas.css';

interface OfertasProps {
  /** Ofertas primero, despues relleno. Lo decide elegirDestacados. */
  productos: CatalogItem[];
  cantidadOfertas: number;
  totalPublicados: number;
}

/**
 * Cuanto ocupa la foto de una card de la fila, segun Ofertas.css: siete
 * columnas de `--oferta-ancho` (165 px) en escritorio, tres en tablet y dos en
 * el celular. Con el `sizes` del catalogo (100vw en el celular) bajaba la
 * version de 720 para una card de media pantalla.
 */
const OFERTA_SIZES = '(min-width: 1024px) 165px, (min-width: 768px) 33vw, 50vw';

function titulo(cantidadOfertas: number, total: number): string {
  if (cantidadOfertas === 0) return 'Nuestros productos';
  if (cantidadOfertas < total) return 'Ofertas y destacados';
  return 'Ofertas de la semana';
}

/**
 * Vive dentro de la banda del hero. Recibe los datos del Server Component
 * padre: no consulta nada. Solo desaparece si no hay ningun producto
 * publicado. La card de cierre va siempre ultima.
 */
export default function Ofertas({ productos, cantidadOfertas, totalPublicados }: OfertasProps) {
  if (productos.length === 0) return null;

  return (
    <div className="ofertas-band" id="ofertas">
      <div className="container">
        <div className="ofertas-cabecera">
          <h2 className="ofertas-titulo">{titulo(cantidadOfertas, productos.length)}</h2>
          <Link href="/productos" className="ofertas-ver-todo">
            Ver todo el catálogo →
          </Link>
        </div>

        <div className="ofertas-grid">
          {productos.map((oferta) => (
            // Sin "Agregar" en el inicio (decision del dueno): se agrega desde el
            // catalogo. La card lleva a su rubro, donde esta el boton.
            <Link key={oferta.id} href={oferta.category ? `/productos/${oferta.category.toLowerCase()}` : '/productos'} className="oferta-card">
              <div className="oferta-image">
                <ProductImage
                  publicId={oferta.imagePublicId || oferta.imageUrl || undefined}
                  alt={oferta.name}
                  sizes={OFERTA_SIZES}
                />
                {/* Rubro arriba a la izquierda, oferta abajo a la derecha: igual que en el catalogo. */}
                {nombreRubro(oferta.category) && <span className="oferta-rubro">{nombreRubro(oferta.category)}</span>}
                {oferta.isOffer && <span className="oferta-badge">Oferta</span>}
              </div>
              <h3 className="oferta-name">{oferta.name}</h3>
              <p className="oferta-price">
                {formatPrice(oferta.price)}
                <span className="oferta-unit"> {formatUnitLabel(oferta.unit, oferta.quantity)}</span>
              </p>
              {formatUnitPrice(oferta.price, oferta.quantity, oferta.unit) && (
                <p className="oferta-unit-price">
                  {formatUnitPrice(oferta.price, oferta.quantity, oferta.unit)}
                </p>
              )}
              {formatPieza(oferta.price, oferta.pesoAprox) && (
                <p className="oferta-unit-price">{formatPieza(oferta.price, oferta.pesoAprox)}</p>
              )}
            </Link>
          ))}

          <Link href="/productos" className="oferta-card oferta-cierre">
            <span className="oferta-cierre-numero">+{totalPublicados}</span>
            <span className="oferta-cierre-texto">productos en el catálogo</span>
            <span className="oferta-cierre-boton">Ver todo</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
