export interface Product {
  Nombre: string;
  Precio: string | number;
  /** Ausente mientras el producto no tenga foto cargada. */
  Imagen?: string;
  Categoría?: string;
  Stock?: string;
  Descripción?: string;
  /** Etiqueta de unidad ya formateada: "por kg", "3 kg". */
  Unidad?: string;
  /** Precio por unidad, ya formateado. Solo en promociones por cantidad. */
  PrecioUnitario?: string;
  EsOferta?: boolean;
  /** Claves para el carrito. Opcionales porque el tipo se comparte con vistas viejas. */
  Id?: string;
  TipoUnidad?: 'Kg' | 'Unidad' | 'Docena' | 'Caja';
  /** Cantidad del producto: 3 en "Asado x 3 kg". */
  Cantidad?: number;
  PrecioNumero?: number;
  /** Peso aproximado en kg si se vende por pieza. */
  PesoAprox?: number;
  /** Texto ya armado para la card: "Pieza ≈ 10 kg · $ 139.000 aprox.". */
  Pieza?: string;
}

export interface ProductCardProps {
  product: Product;
  onClick?: () => void;
}

export interface ProductGridProps {
  products: Product[];
  loading?: boolean;
}

export interface ProductSearchProps {
  onSearch: (term: string) => void;
  placeholder?: string;
}

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  itemsPerPage: number;
  totalItems: number;
}
