import type { Product } from '@/types/product';

/**
 * Formatea un precio numérico a formato argentino: $ 8.500
 */
export function formatPrice(price: string | number): string {
  const numPrice = typeof price === 'string' ? parseFloat(price.replace(/[^0-9.-]/g, '')) : price;

  if (isNaN(numPrice)) return '$ 0';

  return `$ ${numPrice.toLocaleString('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Filtra productos por término de búsqueda (busca en nombre, categoría y descripción)
 */
/** Minusculas y sin tildes: "Carnicería" y "carniceria" se buscan igual. */
export const paraBuscar = (texto: string | undefined | null): string =>
  (texto ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

export function filterProducts(products: Product[], searchTerm: string): Product[] {
  // Sin tildes en los dos lados: el catalogo muestra "Carnicería" (nombreRubro)
  // pero el rubro guardado es "Carniceria", y los nombres vienen de la hoja con
  // o sin tilde ("Lechon", "Vacio"). Buscar lo que se ve tiene que encontrarlo.
  const term = paraBuscar(searchTerm);
  if (!term) return products;

  return products.filter(product =>
    [product.Nombre, product.Categoría, product.Descripción].some((campo) => paraBuscar(campo).includes(term))
  );
}

/**
 * Pagina un array de productos
 */
export function paginateProducts(products: Product[], page: number, itemsPerPage: number): Product[] {
  const start = (page - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return products.slice(start, end);
}

/**
 * Calcula el número total de páginas
 */
export function calculateTotalPages(totalItems: number, itemsPerPage: number): number {
  return Math.ceil(totalItems / itemsPerPage);
}
