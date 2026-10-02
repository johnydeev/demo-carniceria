/**
 * Que dibuja `ProductImage` en la demo. Puro, con tests.
 *
 * La app real arma URLs de Cloudinary o pasa por el proxy de Drive. En la demo
 * no hay ninguno de los dos: las fotos son archivos de /public (con su version
 * de 360 para el srcset, generadas por scripts/imagenes-demo.mjs) o data URL
 * de lo que sube el visitante (fase 3). Cualquier otra cosa es el marcador.
 */
export interface FuenteImagen {
  url: string;
  srcSet?: string;
  source: 'data-url' | 'local-path' | 'invalid';
}

const VERSION_720 = /-720\.webp$/;

/** Como `normalizeInput` de la app real: espacios colapsados y recortados. */
export function normalizarRuta(valor: string): string {
  return valor.replace(/\s+/g, ' ').trim();
}

/** "x-720.webp" → "x-360.webp 360w, x-720.webp 720w"; otra ruta, sin srcset. */
export function srcSetLocal(url: string): string | undefined {
  if (!VERSION_720.test(url)) return undefined;
  return `${url.replace(VERSION_720, '-360.webp')} 360w, ${url} 720w`;
}

export function fuenteDeImagen(entrada?: string | null): FuenteImagen {
  const valor = entrada ? normalizarRuta(entrada) : '';
  if (valor.startsWith('data:image/')) return { url: valor, source: 'data-url' };
  if (valor.startsWith('/') && !valor.startsWith('//')) {
    return { url: valor, srcSet: srcSetLocal(valor), source: 'local-path' };
  }
  return { url: '', source: 'invalid' };
}
