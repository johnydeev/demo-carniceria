/**
 * Configuracion de la vista del catalogo.
 *
 * En la demo no hay hoja de precios: el catalogo sale del store del navegador.
 */
export interface ProductsConfig {
  itemsPerPage: number;
}

export const productsConfig: ProductsConfig = {
  itemsPerPage: 12,
};
