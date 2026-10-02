/* eslint-disable @next/next/no-img-element -- la URL ya trae la transformacion de Cloudinary y el srcset es propio; next/image la volveria a pasar por su optimizador */
'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { anterior, siguiente } from '@/lib/carousel';
import { BANNER_SIZES, bannerSrcSet, bannerUrl } from '@/lib/bannerImage';
import { esEnlaceExterno } from '@/lib/banners';
import { seoConfig } from '@/config/seo.config';
import { negocio } from '@/config/negocio.config';
import { MENSAJES_CONTACTO, TITULO_CONTACTO, useWhatsApp } from '@/demo/WhatsAppModal';
import './HeroCarousel.css';

export interface BannerSlide {
  id: string;
  imagePublicId: string;
  alt: string;
  linkUrl: string | null;
}

const CICLO_MS = 6000;
const SWIPE_MIN_PX = 40;
const REDUCIR_MOVIMIENTO = '(prefers-reduced-motion: reduce)';

/**
 * Lee la media query como store externo: en el servidor es false, en el
 * cliente el valor real, y se actualiza si el usuario cambia la preferencia.
 * Sin setState dentro de un efecto, que React 19 marca como render en cascada.
 */
function usePrefiereMovimientoReducido(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(REDUCIR_MOVIMIENTO);
      mq.addEventListener('change', onChange);
      return () => mq.removeEventListener('change', onChange);
    },
    () => window.matchMedia(REDUCIR_MOVIMIENTO).matches,
    () => false
  );
}

/**
 * Carrusel sin dependencias: un indice, un intervalo y transiciones CSS.
 *
 * Se pausa con el mouse encima, con el foco adentro y con la pestania oculta.
 * Sin autoplay si el sistema pide movimiento reducido. Con cero banners muestra
 * el slide de marca; con uno solo, sin controles.
 */
export default function HeroCarousel({ banners }: { banners: BannerSlide[] }) {
  const total = banners.length;
  const [actual, setActual] = useState(0);
  const [pausado, setPausado] = useState(false);
  const reducido = usePrefiereMovimientoReducido();
  const toqueX = useRef<number | null>(null);
  const { mostrar } = useWhatsApp();

  useEffect(() => {
    if (total < 2 || pausado || reducido) return;

    const id = setInterval(() => {
      if (document.visibilityState === 'visible') {
        setActual((i) => siguiente(i, total));
      }
    }, CICLO_MS);

    return () => clearInterval(id);
  }, [total, pausado, reducido]);

  const irA = useCallback((i: number) => setActual(i), []);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') setActual((i) => siguiente(i, total));
    if (e.key === 'ArrowLeft') setActual((i) => anterior(i, total));
  };

  const onTouchStart = (e: React.TouchEvent) => {
    toqueX.current = e.touches[0].clientX;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (toqueX.current === null) return;
    const delta = e.changedTouches[0].clientX - toqueX.current;
    toqueX.current = null;
    if (Math.abs(delta) < SWIPE_MIN_PX) return;
    setActual((i) => (delta < 0 ? siguiente(i, total) : anterior(i, total)));
  };

  if (total === 0) {
    return (
      <div className="carrusel carrusel-marca" role="region" aria-label={negocio.nombre}>
        <Image
          src="/demo/marca/logo.png"
          alt=""
          width={260}
          height={80}
          priority
          className="carrusel-marca-logo"
        />
        <p className="carrusel-marca-titulo">{negocio.nombre}</p>
        <p className="carrusel-marca-sub">
          Desde {negocio.fundado}, una tradición en {negocio.direccion.localidad}
        </p>
        {/* En la demo no se abre wa.me: el modal muestra el mensaje que saldria. */}
        <button
          type="button"
          className="carrusel-marca-cta"
          onClick={() => mostrar({ titulo: TITULO_CONTACTO, mensaje: MENSAJES_CONTACTO.pedido })}
        >
          Pedir por WhatsApp
        </button>
      </div>
    );
  }

  return (
    <div
      className="carrusel"
      role="region"
      aria-roledescription="carrusel"
      aria-label="Carteles promocionales"
      tabIndex={0}
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      onFocus={() => setPausado(true)}
      onBlur={() => setPausado(false)}
      onKeyDown={onKeyDown}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {banners.map((b, i) => {
        const activo = i === actual;
        const imagen = (
          <img
            src={bannerUrl(b.imagePublicId, 1200)}
            srcSet={bannerSrcSet(b.imagePublicId)}
            sizes={BANNER_SIZES}
            alt={b.alt}
            width={1200}
            height={500}
            loading={i === 0 ? 'eager' : 'lazy'}
            fetchPriority={i === 0 ? 'high' : 'auto'}
            draggable={false}
          />
        );

        return (
          <div
            key={b.id}
            className={`carrusel-slide ${activo ? 'activo' : ''}`}
            aria-hidden={!activo}
          >
            {b.linkUrl && esEnlaceExterno(b.linkUrl, seoConfig.domain) ? (
              // Otro sitio (el post de Instagram): pestana nueva, sin sacar al cliente de la tienda.
              <a href={b.linkUrl} target="_blank" rel="noopener noreferrer" tabIndex={activo ? 0 : -1}>
                {imagen}
              </a>
            ) : b.linkUrl ? (
              <Link href={b.linkUrl} tabIndex={activo ? 0 : -1}>
                {imagen}
              </Link>
            ) : (
              imagen
            )}
          </div>
        );
      })}

      {total > 1 && (
        <>
          <button
            type="button"
            className="carrusel-flecha carrusel-flecha-izq"
            onClick={() => setActual((i) => anterior(i, total))}
            aria-label="Cartel anterior"
          >
            ‹
          </button>
          <button
            type="button"
            className="carrusel-flecha carrusel-flecha-der"
            onClick={() => setActual((i) => siguiente(i, total))}
            aria-label="Cartel siguiente"
          >
            ›
          </button>
          {/* Botones comunes con aria-current, no tabs: un role="tab" exige un
              tabpanel asociado y navegacion con flechas que el carrusel no tiene. */}
          <div className="carrusel-puntos" role="group" aria-label="Elegir cartel">
            {banners.map((b, i) => (
              <button
                key={b.id}
                type="button"
                aria-current={i === actual ? 'true' : undefined}
                aria-label={`Cartel ${i + 1} de ${total}`}
                className={`carrusel-punto ${i === actual ? 'activo' : ''}`}
                onClick={() => irA(i)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
