export interface AboutMeProps {
  /** Ruta bajo /public. Sin foto, la columna no se renderiza. */
  fotoLocal?: string;
}

export interface ReviewCardProps {
  text: string;
  rating?: number;
  author?: string;
}
