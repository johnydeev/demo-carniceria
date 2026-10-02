export interface LegalSeccion {
  titulo: string;
  parrafos?: string[];
  lista?: string[];
  /** Texto que cierra la seccion, despues de la lista. */
  cierre?: string;
}

export interface LegalDoc {
  titulo: string;
  /** ISO (YYYY-MM-DD). Se muestra como "Ultima actualizacion". */
  actualizado: string;
  intro: string;
  secciones: LegalSeccion[];
}
