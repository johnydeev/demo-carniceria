export const PRODUCT_CATEGORIES = [
  'Carniceria',
  'Granja',
  'Fiambreria',
  'Almacen',
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export function isValidProductCategory(value: string): value is ProductCategory {
  return PRODUCT_CATEGORIES.includes(value as ProductCategory);
}

/** Como se muestra cada rubro: el enum de la base no lleva tildes. */
const NOMBRE_RUBRO: Record<ProductCategory, string> = {
  Carniceria: 'Carnicería',
  Granja: 'Granja',
  Fiambreria: 'Fiambrería',
  Almacen: 'Almacén',
};

export function nombreRubro(categoria: string | null | undefined): string | null {
  if (!categoria) return null;
  return isValidProductCategory(categoria) ? NOMBRE_RUBRO[categoria] : categoria;
}

/**
 * Sinonimos que puede traer la columna `rubro` de la hoja, ya normalizados
 * (minusculas, sin acentos). El dueño escribe "Res", "Cerdo" o "Pollo" como
 * en la carniceria; la base tiene cuatro rubros. Un nombre que no esta aca
 * se rechaza con el mensaje del diagnostico.
 */
const SINONIMOS: Record<string, ProductCategory> = {
  carniceria: 'Carniceria',
  res: 'Carniceria',
  vacuno: 'Carniceria',
  vaca: 'Carniceria',
  ternera: 'Carniceria',
  novillo: 'Carniceria',
  cerdo: 'Carniceria',
  achuras: 'Carniceria',
  granja: 'Granja',
  pollo: 'Granja',
  ave: 'Granja',
  aves: 'Granja',
  huevos: 'Granja',
  fiambreria: 'Fiambreria',
  fiambres: 'Fiambreria',
  almacen: 'Almacen',
};

const normalizar = (v: string) =>
  v
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

/** Rubro de la hoja a categoria de la base; null si no se reconoce. */
export function resolverCategoria(value: string): ProductCategory | null {
  return SINONIMOS[normalizar(value)] ?? null;
}
