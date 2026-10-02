export interface ProductImageProps {
  /** Ausente cuando el producto se creo desde la hoja y todavia no tiene foto:
   *  el componente dibuja un marcador en su lugar. */
  publicId?: string | null;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
}
