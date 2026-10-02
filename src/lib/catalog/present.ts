import type { Product } from '@/types/product';
import type { CatalogItem } from './types';
import { formatUnitLabel, formatUnitPrice, formatPieza } from './format';

/**
 * Traduce del modelo interno al tipo Product que consumen los componentes,
 * con sus claves en español heredadas de la planilla original.
 *
 * Esta es la unica costura entre los dos vocabularios. Vive aca y no en las
 * paginas para que el catalogo general y el de cada rubro no se desincronicen.
 * Ver docs/decisiones.md #004.
 */
export function toCatalogProducts(items: CatalogItem[]): Product[] {
  return items.map((item) => ({
    Nombre: item.name,
    Precio: item.price,
    Imagen: item.imagePublicId || item.imageUrl || undefined,
    Categoría: item.category || undefined,
    Stock: item.stock || undefined,
    Descripción: item.description || undefined,
    // Con peso aproximado el precio de la hoja es por kilo, aunque se venda por caja.
    Unidad: item.pesoAprox ? 'por kg' : formatUnitLabel(item.unit, item.quantity),
    PrecioUnitario: formatUnitPrice(item.price, item.quantity, item.unit),
    EsOferta: item.isOffer,
    Id: item.id,
    TipoUnidad: item.unit as Product['TipoUnidad'],
    Cantidad: item.quantity,
    PrecioNumero: item.price,
    PesoAprox: item.pesoAprox ?? undefined,
    Pieza: formatPieza(item.price, item.pesoAprox),
  }));
}
