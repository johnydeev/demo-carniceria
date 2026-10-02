import type { CatalogItem } from './types';
import type { ProductoCarrito } from '../cart/types';

/** Un item del catalogo publicado ya es "disponible": getCatalog solo devuelve esos. */
export function aProductoCarrito(item: CatalogItem): ProductoCarrito {
  return {
    id: item.id,
    name: item.name,
    price: item.price,
    unit: item.unit,
    quantity: item.quantity,
    isOffer: item.isOffer,
    pesoAprox: item.pesoAprox,
    imagePublicId: item.imagePublicId,
    imageUrl: item.imageUrl,
    disponible: item.price > 0,
  };
}
