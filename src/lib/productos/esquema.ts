/**
 * Los bodies de POST, PUT y DELETE de /api/products, validados con Zod.
 *
 * Viven aca y no en las rutas porque un route.ts de Next no puede exportar
 * nada que no sea un handler, y asi se prueban con node --test. Conservan las
 * reglas y los mensajes que el panel ya mostraba: antes se validaban a mano, y
 * un campo que no era texto (`name: 5`) reventaba en `.trim()` con un 500 sin
 * cuerpo.
 */
import { z } from 'zod';
import { isValidProductCategory, PRODUCT_CATEGORIES } from '../productCategories.ts';
import type { ProductCategory } from '../productCategories.ts';

export const UNIDADES = ['Kg', 'Unidad', 'Docena', 'Caja'] as const;

export const ERROR_OBLIGATORIOS = 'Nombre, codigo y categoria son obligatorios.';
export const ERROR_UNIDAD = `Unidad invalida. Usa una de: ${UNIDADES.join(', ')}.`;
export const ERROR_CATEGORIA = `Categoria invalida. Usa una de: ${PRODUCT_CATEGORIES.join(', ')}.`;
export const ERROR_CANTIDAD = 'La cantidad debe ser mayor a cero.';
export const ERROR_PESO = 'El peso aproximado debe ser mayor a cero.';
export const ERROR_PESO_SOLO_KILO =
  'El peso aproximado es solo para piezas con precio por kilo: unidad Kg y cantidad 1.';
export const ERROR_PRECIO_INICIAL = 'El precio inicial no es un numero valido.';
export const ERROR_PRECIO = 'El precio debe ser un numero mayor o igual a cero.';
export const ERROR_CODIGO_VACIO = 'El codigo no puede quedar vacio.';
export const ERROR_SIN_PRODUCTOS = 'Hay que indicar al menos un producto.';
export const ERROR_LISTA = 'Lista de productos inválida.';
/** No es un error: el PUT lo devuelve como aviso y el precio se guarda igual (#041). */
export const AVISO_PRECIO_CERO = 'Con precio 0 el producto no se publica en el catálogo.';

/** Texto opcional, sin espacios en los bordes. null y ausente quedan en undefined. */
const texto = (error: string) =>
  z
    .string({ error })
    .nullish()
    .transform((v) => (typeof v === 'string' ? v.trim() : undefined))
    // Sin esto Zod 4 trata la clave como obligatoria: un transform no es opcional.
    .optional();

/** Numero tal como puede llegar del formulario: numero o texto. Se convierte despues. */
const numeroCrudo = (error: string) => z.union([z.number(), z.string()], { error }).nullish();

const vacio = (v: unknown) => v === undefined || v === null || v === '';

export type Unidad = (typeof UNIDADES)[number];

const esUnidad = (v: string): v is Unidad => (UNIDADES as readonly string[]).includes(v);

/**
 * El peso aproximado es para piezas con **precio por kilo**: unidad Kg y
 * cantidad 1. Si el precio es de un pack, multiplicarlo por el peso lo
 * duplica. Se evalua sobre lo que queda despues del cambio.
 */
export function pesoPermitido(pesoAprox: number | null, unit: string, quantity: number): boolean {
  return pesoAprox === null || (unit === 'Kg' && quantity === 1);
}

export const ProductoNuevoSchema = z
  .object({
    name: texto(ERROR_OBLIGATORIOS),
    code: texto(ERROR_OBLIGATORIOS),
    category: texto(ERROR_OBLIGATORIOS),
    imageUrl: texto('La foto no es valida.'),
    imagePublicId: texto('La foto no es valida.'),
    stock: texto('El stock debe ser texto.'),
    description: texto('La descripcion debe ser texto.'),
    unit: texto(ERROR_UNIDAD),
    quantity: numeroCrudo(ERROR_CANTIDAD),
    isOffer: z.unknown().optional(),
    pesoAprox: numeroCrudo(ERROR_PESO),
    // Precio inicial opcional: no se guarda en la base, se escribe en la hoja.
    initialPrice: numeroCrudo(ERROR_PRECIO_INICIAL),
  })
  .transform((b, ctx) => {
    const fallar = (message: string) => {
      ctx.addIssue({ code: 'custom', message });
      return z.NEVER;
    };

    const name = b.name ?? '';
    const code = (b.code ?? '').toUpperCase();
    const category = b.category ?? '';
    const unit = b.unit || 'Unidad';
    const quantity = Number(b.quantity ?? 1);
    const pesoAprox = vacio(b.pesoAprox) ? null : Number(b.pesoAprox);
    const initialPrice = vacio(b.initialPrice) ? undefined : Number(b.initialPrice);

    // El mismo orden de chequeos que tenia la ruta: el panel muestra el primero.
    // La foto es opcional: la hoja puede nombrar una del catalogo comun al sincronizar.
    if (!name || !category || !code) return fallar(ERROR_OBLIGATORIOS);
    if (!esUnidad(unit)) return fallar(ERROR_UNIDAD);
    if (pesoAprox !== null && !(pesoAprox > 0)) return fallar(ERROR_PESO);
    if (!pesoPermitido(pesoAprox, unit, quantity)) return fallar(ERROR_PESO_SOLO_KILO);
    if (!Number.isFinite(quantity) || quantity <= 0) return fallar(ERROR_CANTIDAD);
    if (initialPrice !== undefined && (!Number.isFinite(initialPrice) || initialPrice < 0)) {
      return fallar(ERROR_PRECIO_INICIAL);
    }
    if (!isValidProductCategory(category)) return fallar(ERROR_CATEGORIA);

    return {
      name,
      code,
      category: category as ProductCategory,
      unit: unit as Unidad,
      imageUrl: b.imageUrl,
      imagePublicId: b.imagePublicId,
      stock: b.stock,
      description: b.description,
      quantity,
      isOffer: Boolean(b.isOffer),
      pesoAprox,
      initialPrice,
    };
  });

/**
 * Edicion: todo opcional. `undefined` es "no vino, se conserva"; en
 * `category` y `pesoAprox`, `null` es "vino vacio, se borra".
 *
 * La regla del peso (`pesoPermitido`) no esta aca: necesita el producto
 * guardado para saber la unidad y la cantidad que quedan.
 */
export const ProductoEdicionSchema = z
  .object({
    name: texto('El nombre debe ser texto.'),
    imageUrl: texto('La foto no es valida.'),
    imagePublicId: texto('La foto no es valida.'),
    stock: texto('El stock debe ser texto.'),
    description: texto('La descripcion debe ser texto.'),
    category: z.unknown().optional(),
    price: numeroCrudo(ERROR_PRECIO),
    code: z.unknown().optional(),
    unit: z.unknown().optional(),
    quantity: numeroCrudo(ERROR_CANTIDAD),
    isOffer: z.unknown().optional(),
    pesoAprox: numeroCrudo(ERROR_PESO),
  })
  .transform((b, ctx) => {
    const fallar = (message: string) => {
      ctx.addIssue({ code: 'custom', message });
      return z.NEVER;
    };

    // El precio se puede editar desde el panel, pero la hoja manda: la ruta lo
    // escribe primero en la fila y recien despues en la base.
    const precioCrudo = vacio(b.price) ? undefined : Number(b.price);
    if (precioCrudo !== undefined && (!Number.isFinite(precioCrudo) || precioCrudo < 0)) {
      return fallar(ERROR_PRECIO);
    }
    // Pesos enteros, igual que en la hoja (precioParaHoja): si la base guardara
    // centavos, la proxima lectura de la hoja la corregiria igual.
    const price = precioCrudo === undefined ? undefined : Math.round(precioCrudo);

    // Si vino, no puede quedar vacio: se guardaba un producto sin nombre. El
    // texto ya llega sin espacios en los bordes. Mismo mensaje que el alta.
    if (b.name === '') return fallar(ERROR_OBLIGATORIOS);

    const code = typeof b.code === 'string' ? b.code.trim().toUpperCase() : undefined;
    if (code === '') return fallar(ERROR_CODIGO_VACIO);

    const unit = typeof b.unit === 'string' ? b.unit.trim() : undefined;
    if (unit !== undefined && !esUnidad(unit)) return fallar(ERROR_UNIDAD);

    const pesoAprox =
      b.pesoAprox === undefined ? undefined : b.pesoAprox === null || b.pesoAprox === '' ? null : Number(b.pesoAprox);
    if (pesoAprox != null && !(pesoAprox > 0)) return fallar(ERROR_PESO);

    const quantity = b.quantity === undefined || b.quantity === null ? undefined : Number(b.quantity);
    if (quantity !== undefined && (!Number.isFinite(quantity) || quantity <= 0)) return fallar(ERROR_CANTIDAD);

    // Vino la clave: vacia (o no texto) borra el rubro; con texto tiene que ser valido.
    let category: ProductCategory | null | undefined = undefined;
    if (b.category !== undefined) {
      const crudo = typeof b.category === 'string' ? b.category.trim() : '';
      if (!crudo) category = null;
      else if (!isValidProductCategory(crudo)) return fallar(ERROR_CATEGORIA);
      else category = crudo;
    }

    return {
      name: b.name,
      imageUrl: b.imageUrl,
      imagePublicId: b.imagePublicId,
      stock: b.stock,
      description: b.description,
      category,
      price,
      code,
      unit: unit as Unidad | undefined,
      quantity,
      isOffer: typeof b.isOffer === 'boolean' ? b.isOffer : undefined,
      pesoAprox,
    };
  });

/** Borrado masivo: `{ ids: string[] }`, de 1 a 500. */
export const BorradoSchema = z.object(
  {
    ids: z
      .array(z.string({ error: ERROR_LISTA }).min(1, { error: ERROR_LISTA }), { error: ERROR_SIN_PRODUCTOS })
      .min(1, { error: ERROR_SIN_PRODUCTOS })
      .max(500, { error: ERROR_LISTA }),
  },
  { error: ERROR_SIN_PRODUCTOS }
);
