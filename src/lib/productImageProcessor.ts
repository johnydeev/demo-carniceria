export const PRODUCT_CARD_IMAGE_SIZE = {
  width: 720,
  height: 540,
} as const;

export const PRODUCT_CARD_IMAGE_RECOMMENDED_UPLOAD = {
  width: 1200,
  height: 900,
} as const;

const CLOUDINARY_UPLOAD_SEGMENT = '/image/upload/';

/**
 * Encaja la foto completa dentro del marco de la tarjeta y rellena los costados
 * con un color que Cloudinary toma de los bordes de la propia imagen.
 *
 * Se eligio rellenar en lugar de recortar (`c_fill,g_auto`) porque las fotos de
 * producto llegan en proporciones distintas: una cuadrada perdia una franja
 * arriba y otra abajo. Con `c_pad` todas las tarjetas quedan del mismo tamano
 * sin que ninguna pierda contenido.
 */
export function buildCloudinaryTransform(width: number, height: number): string {
  return `f_auto,q_auto,c_pad,b_auto,w_${width},h_${height}`;
}

export function buildCloudinaryDeliveryUrl(
  publicId: string,
  cloudName: string,
  width: number,
  height: number
): string {
  const transform = buildCloudinaryTransform(width, height);
  return `https://res.cloudinary.com/${cloudName}/image/upload/${transform}/${publicId}`;
}

/**
 * Anchos del srcset de las cards, proporcion 4:3. Solo dos: el de mobile a
 * doble densidad y el actual. Un 1080 nunca lo elegiria el navegador (4
 * columnas a 1280 px por DPR 2 dan 640) y sumaria derivadas de gusto (#015).
 */
export const PRODUCT_CARD_SRCSET_WIDTHS = [360, 720] as const;

export function buildCloudinarySrcSet(publicId: string, cloudName: string): string {
  return PRODUCT_CARD_SRCSET_WIDTHS.map(
    (w) => `${buildCloudinaryDeliveryUrl(publicId, cloudName, w, Math.round((w * 3) / 4))} ${w}w`
  ).join(', ');
}

/**
 * Cuanto ocupa una card segun el viewport. Sigue a ProductGrid.css: una
 * columna en mobile, dos desde 768 px, y desde 1024 px un auto-fill de
 * minimo 210 px dentro de 1120 px, que da cards de unos 270 px como mucho.
 */
export const PRODUCT_CARD_SIZES = '(min-width: 1024px) 270px, (min-width: 768px) 50vw, 100vw';

export function normalizeCloudinaryDeliveryUrl(
  cloudinaryUrl: string,
  width: number,
  height: number
): string {
  const uploadIndex = cloudinaryUrl.indexOf(CLOUDINARY_UPLOAD_SEGMENT);
  if (uploadIndex === -1) return cloudinaryUrl;

  const prefix = cloudinaryUrl.slice(
    0,
    uploadIndex + CLOUDINARY_UPLOAD_SEGMENT.length
  );
  const suffix = cloudinaryUrl.slice(
    uploadIndex + CLOUDINARY_UPLOAD_SEGMENT.length
  );
  const versionIndex = suffix.search(/v\d+\//);
  const normalizedSuffix = versionIndex >= 0 ? suffix.slice(versionIndex) : suffix;
  const transform = buildCloudinaryTransform(width, height);

  return `${prefix}${transform}/${normalizedSuffix}`;
}
