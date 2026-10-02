/**
 * Portado de `getCatalog()` (src/services/catalog.service.ts): que se publica.
 *
 * En la app real publica el cruce de la base con la hoja: fila activa y precio
 * mayor a cero. En la demo no hay hoja: `isPublished` hace de "activo" y el
 * precio es el del producto. Un precio en cero no se publica, como en la real.
 */
import type { CatalogItem } from '../../lib/catalog/types';
import type { ProductoDemo } from '../tipos';

export interface OpcionesCatalogo {
  category?: string;
  onlyOffers?: boolean;
}

function aItem(p: ProductoDemo): CatalogItem {
  return {
    id: p.id,
    code: p.code,
    name: p.name,
    price: p.price,
    imageUrl: p.imageUrl,
    imagePublicId: p.imagePublicId,
    category: p.category,
    stock: p.stock,
    description: p.description,
    unit: p.unit,
    quantity: p.quantity,
    isOffer: p.isOffer,
    isPublished: p.isPublished,
    pesoAprox: p.pesoAprox,
    // No hay respaldo: el precio siempre es el vigente.
    priceFromSheet: true,
  };
}

/** Lo publicado, lo mas nuevo primero (el `orderBy: createdAt desc` de la real). */
export function catalogoPublicable(productos: ProductoDemo[], opciones: OpcionesCatalogo = {}): CatalogItem[] {
  let items = productos
    .filter((p) => p.isPublished && p.price > 0)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map(aItem);

  if (opciones.category) items = items.filter((i) => i.category === opciones.category);
  if (opciones.onlyOffers) items = items.filter((i) => i.isOffer);
  return items;
}
