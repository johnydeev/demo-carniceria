/**
 * Traduce el nombre corto de la columna `imagen` a un public ID de Cloudinary.
 *
 * Funcion pura y separada del acceso a Google a proposito: es la pieza donde un
 * error hace desaparecer una foto sin emitir ningun error, y es la unica que se
 * puede probar sin red.
 *
 * Ver docs/superpowers/specs/2026-08-29-imagenes-catalogo-comun-design.md
 */

/**
 * Carpeta del catalogo comun, compartida entre todos los clientes.
 *
 * Plana a proposito: la celda lleva solo el nombre corto y la carpeta la pone
 * el codigo, asi que una subcarpeta obligaria a escribirla en cada celda.
 */
export const CARPETA_COMUN = 'catalogo-comun';

/**
 * Extensiones que se descartan si el duenio escribio el nombre del archivo.
 * Las mismas que acepta `EXTENSIONES` de `../catalogo-comun/src/lib/nombres.ts`:
 * un `.gif` o un `.svg` no se puede subir alla, asi que aca no se saca y el
 * nombre queda invalido.
 */
const EXTENSION = /\.(jpg|jpeg|png|webp|avif)$/i;

/**
 * Regla de nombre del catalogo comun: minusculas, digitos y guiones simples,
 * sin guion al principio ni al final. Copia exacta de `KEBAB` en `nombres.ts`
 * del proyecto hermano (#016): si las dos no aceptan lo mismo, un nombre valido
 * en la hoja apunta a una foto que no puede existir en Cloudinary.
 */
const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/**
 * Devuelve el public ID completo, o undefined si la celda no nombra una imagen.
 *
 * Una celda con barra se descarta: **la hoja no elige carpeta**. Aceptarla
 * abriria la puerta a que apunte a la carpeta de otro comercio, y la division
 * es justamente que la hoja nombra el catalogo comun y el panel carga lo propio.
 * La regla kebab-case lo cubre (y tambien la barra invertida, `..`, espacios,
 * `?` y `#`), pero el chequeo de la barra queda explicito por ser el candado.
 */
export function resolveImagePublicId(celda?: string): string | undefined {
  if (!celda) return undefined;

  const limpio = celda.trim().toLowerCase().replace(EXTENSION, '');

  if (limpio === '') return undefined;
  if (limpio.includes('/')) return undefined;
  if (!KEBAB.test(limpio)) return undefined;

  return `${CARPETA_COMUN}/${limpio}`;
}
