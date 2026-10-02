'use client';

import Link from 'next/link';
import Image from 'next/image';
import { negocio } from '@/config/negocio.config';
import { textoHorario } from '@/lib/horario/texto';
import { anioEnArgentina } from '@/lib/fechas';
import { useHorario } from '@/demo/hooks';
import { MENSAJES_CONTACTO, TITULO_CONTACTO, useWhatsApp } from '@/demo/WhatsAppModal';
import '@components/layout/footer/Footer.css';

/** Servicios del comercio de ejemplo. */
const SERVICIOS = [
  'Cortes a pedido, a la vista',
  'Pollo y achuras frescos todos los días',
  'Fiambres y almacén',
  'Pedidos por la web para retirar sin fila',
  'Envíos al barrio',
];

/**
 * Componente de cliente en la demo: el horario sale del store del navegador.
 * El telefono abre el modal de WhatsApp en lugar de wa.me, y la direccion va
 * sin enlace a Maps.
 */
const Footer = () => {
  // En hora argentina, como en la app real.
  const anio = anioEnArgentina();
  const horario = useHorario();
  const horarios = horario ? textoHorario(horario) : [];
  const { mostrar } = useWhatsApp();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-columns">
          <div className="footer-column footer-branding">
            <Link href="/" className="footer-logo" aria-label={`${negocio.nombre}, inicio`}>
              <Image src="/demo/marca/logo.png" alt={negocio.nombre} width={150} height={46} />
            </Link>
            <p className="footer-description">
              {negocio.claim}. Desde {negocio.fundado}.
            </p>
            {(negocio.redes.facebook || negocio.redes.instagram) && (
              <div className="social-links">
                {negocio.redes.facebook && (
                  <a href={negocio.redes.facebook} target="_blank" rel="noopener noreferrer" className="social-link" aria-label={`Facebook de ${negocio.nombre}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                    </svg>
                  </a>
                )}
                {negocio.redes.instagram && (
                  <a href={negocio.redes.instagram} target="_blank" rel="noopener noreferrer" className="social-link" aria-label={`Instagram de ${negocio.nombre}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                    </svg>
                  </a>
                )}
              </div>
            )}
          </div>

          <div className="footer-column">
            <h3 className="footer-title">Servicios</h3>
            <ul className="footer-list">
              {SERVICIOS.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>

          <div className="footer-column">
            <h3 className="footer-title">Contacto</h3>
            <ul className="footer-list footer-contact">
              <li>
                {negocio.direccion.calle}, {negocio.direccion.localidad}
              </li>
              <li>
                <button
                  type="button"
                  className="footer-boton-enlace"
                  onClick={() => mostrar({ titulo: TITULO_CONTACTO, mensaje: MENSAJES_CONTACTO.consulta })}
                >
                  {negocio.telefono}
                </button>
              </li>
              <li>
                <a href={`mailto:${negocio.email}`}>{negocio.email}</a>
              </li>
              {horarios.map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="copyright">
            © {anio} {negocio.nombre}. Todos los derechos reservados.
          </p>
          <nav className="footer-legal" aria-label="Enlaces legales">
            <Link href="/terminos">Términos y condiciones</Link>
            <Link href="/privacidad">Política de privacidad</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
