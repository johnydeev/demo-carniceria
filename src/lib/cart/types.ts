/** Lo que se guarda: en localStorage sin sesion, en CartItem con sesion. */
export interface ItemCarrito {
  productId: string;
  quantity: number;
}

/** Lo que hace falta del producto para dibujar una linea y calcular. */
export interface ProductoCarrito {
  id: string;
  name: string;
  price: number;
  unit: string;
  /** Cantidad del producto: 3 en "Asado x 3 kg". */
  quantity: number;
  isOffer: boolean;
  /** Peso aproximado en kg si se vende por pieza; null si no. */
  pesoAprox: number | null;
  imagePublicId: string | null;
  imageUrl: string | null;
  /** false si dejo de estar publicado o no tiene precio. */
  disponible: boolean;
}

export interface LineaCarrito extends ItemCarrito {
  /** null mientras no se resolvio o si el producto ya no existe. */
  producto: ProductoCarrito | null;
}
