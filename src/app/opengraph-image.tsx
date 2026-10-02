import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { negocio } from '@/config/negocio.config';

export const alt = 'Carnicería La Esquina, demo de tienda online para carnicerías';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/**
 * Imagen OG de la demo: logo nuevo sobre placa blanca, claim y la aclaracion
 * de que es una demo.
 *
 * Los hex van escritos porque esto renderiza fuera del DOM: no hay
 * globals.css ni tokens. Son --color-brand y --color-brand-dark.
 */
export default async function Image() {
  const logo = await readFile(join(process.cwd(), 'public/demo/marca/logo.png'));
  const logoSrc = `data:image/png;base64,${logo.toString('base64')}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 28,
          background: 'linear-gradient(160deg, #1f2a8c 0%, #161f6b 100%)',
          color: '#fff',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', background: '#fff', borderRadius: 16, padding: '20px 36px' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoSrc} width={390} height={120} alt="" />
        </div>
        <div style={{ fontSize: 46, fontWeight: 800, letterSpacing: -1, maxWidth: 1000, textAlign: 'center' }}>
          {negocio.claim}
        </div>
        {/* Una sola cadena: Satori exige display flex en nodos con varios hijos. */}
        <div style={{ fontSize: 30, opacity: 0.85 }}>{`Demo · ${negocio.nombre}`}</div>
      </div>
    ),
    size
  );
}
