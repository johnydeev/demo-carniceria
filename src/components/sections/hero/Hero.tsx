'use client';

import { useMemo } from 'react';
import { negocio } from '@/config/negocio.config';
import { elegirDestacados } from '@/lib/destacados';
import { useBannersVigentes, useCatalogo } from '@/demo/hooks';
import HeroCarousel from './HeroCarousel';
import Ofertas from '@/components/sections/ofertas/Ofertas';
import './Hero.css';

/**
 * Cards de producto en la fila; la de cierre va aparte, siempre ultima. Seis y
 * no cinco: en el celular, a dos columnas, cinco dejaban una card sola en la
 * ultima fila. Con seis quedan tres filas parejas y el cierre a lo ancho.
 */
const CARDS_EN_FILA = 6;

/**
 * Banda indigo con el h1, el carrusel de carteles y las ofertas debajo. En la
 * app real es un Server Component; en la demo lee carteles y catalogo del
 * store. Hasta hidratar, el carrusel muestra su caja vacia (mismo alto) y la
 * fila no aparece.
 */
export default function Hero() {
  const productos = useCatalogo();
  const banners = useBannersVigentes();

  const destacados = useMemo(() => elegirDestacados(productos ?? [], CARDS_EN_FILA), [productos]);

  return (
    <section id="hero" className="hero-section">
      <div className="container">
        <h1 className="hero-claim">{negocio.claim}</h1>
      </div>
      {/* Fuera del container: edge a edge en mobile, 1200 px —el tamano real del cartel— en desktop. */}
      <div className="hero-carrusel">
        {banners === null ? (
          <div className="carrusel" aria-busy="true" aria-label="Cargando carteles" />
        ) : (
          <HeroCarousel
            banners={banners.map((b) => ({
              id: b.id,
              // En la demo la imagen es una ruta de /public o un data URL: bannerUrl la devuelve tal cual.
              imagePublicId: b.imageUrl,
              alt: b.alt,
              linkUrl: b.linkUrl,
            }))}
          />
        )}
      </div>
      {productos && (
        <Ofertas
          productos={destacados.seleccion}
          cantidadOfertas={destacados.cantidadOfertas}
          totalPublicados={productos.length}
        />
      )}
    </section>
  );
}
