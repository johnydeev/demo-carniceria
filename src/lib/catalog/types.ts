/** Una fila de la hoja de cálculo, resuelta por nombre de encabezado. */
export interface SheetRow {
  codigo: string;
  precio: string;
  activo: string;
  /** Informativo para el dueño, y usado solo al crear el producto desde la hoja. */
  nombre?: string;
  /** Rubro, usado solo al crear el producto desde la hoja. */
  rubro?: string;
  /** Nombre corto de la imagen en el catalogo comun. Sin carpeta ni extension. */
  imagen?: string;
}

/** Un producto tal como sale de la base, con el precio ya convertido a número. */
export interface ProductRecord {
  id: string;
  code: string;
  name: string;
  price: number;
  imageUrl: string | null;
  imagePublicId: string | null;
  category: string | null;
  stock: string | null;
  description: string | null;
  unit: string;
  quantity: number;
  isOffer: boolean;
  isPublished: boolean;
  /** Venta por pieza de peso variable: peso aproximado en kg. null si se vende por unidad de cantidad. */
  pesoAprox: number | null;
}

/** Un producto listo para mostrar, con el precio ya resuelto. */
export interface CatalogItem extends ProductRecord {
  /** false cuando el precio salió del respaldo y no de la hoja. */
  priceFromSheet: boolean;
}

/** Lo que el panel necesita para que un error de datos no pase inadvertido. */
export interface CatalogDiagnostics {
  /** Productos de la base sin fila en la hoja. No se publican. */
  missingRows: string[];
  /** Filas de la hoja sin producto en la base. */
  orphanRows: string[];
  /**
   * Filas activas cuyo precio no es un número (se usa el respaldo) o es cero
   * (no se publica).
   */
  invalidPrices: string[];
  /**
   * Códigos (sin ceros a la izquierda) que aparecen en más de una fila. El
   * panel no puede editar su precio ni su código hasta que se corrija la hoja.
   * Opcional porque el respaldo (hoja sin leer) no lo calcula.
   */
  codigosRepetidos?: string[];
  /** Filas que no se pudieron convertir en producto, con el motivo. */
  notCreated?: string[];
  /** Productos publicados que todavía no tienen foto. */
  missingImages?: string[];
}

export interface MergeResult {
  items: CatalogItem[];
  diagnostics: CatalogDiagnostics;
}

export interface CatalogResult extends MergeResult {
  /** true cuando la hoja no respondió y se usó el respaldo. */
  stale: boolean;
  /** Momento de la última lectura exitosa, si hubo alguna. */
  readAt: Date | null;
}
