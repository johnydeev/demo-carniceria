/**
 * URLs de entrega del carrusel. Cadena de transformacion **propia**, separada
 * de la de ProductCard: asi no se regeneran las derivadas del catalogo (ver
 * trampa de #015). `c_limit` no recorta, y el carrusel tampoco: va a 12:5 en
 * todas las pantallas (#037).
 *
 * En la demo el cartel es un archivo de /public o un data URL de lo que sube
 * el visitante: va tal cual, sin transformacion ni srcset. Sin cloud name
 * escrito en el codigo: la rama de Cloudinary solo arma URL si hay variable.
 */

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? '';

/** El original mide 1200: pedir mas ancho no agranda nada. */
export const ANCHOS_BANNER = [640, 960, 1200] as const;

const esLocal = (src: string) => src.startsWith('/') || src.startsWith('data:');

export function bannerUrl(publicId: string, ancho: number): string {
  if (esLocal(publicId)) return publicId;
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/f_auto,q_auto,c_limit,w_${ancho}/${publicId}`;
}

export function bannerSrcSet(publicId: string): string | undefined {
  if (esLocal(publicId)) return undefined;
  return ANCHOS_BANNER.map((w) => `${bannerUrl(publicId, w)} ${w}w`).join(', ');
}

export const BANNER_SIZES = '(min-width: 1240px) 1200px, 100vw';
