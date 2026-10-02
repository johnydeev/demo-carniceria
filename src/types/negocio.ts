export interface NegocioConfig {
  nombre: string;
  /** Una linea: es el h1 de la landing y el claim del OG. */
  claim: string;
  fundado: number;
  direccion: {
    calle: string;
    localidad: string;
    provincia: string;
    cp: string;
    pais: string;
  };
  geo: { lat: number; lng: number };
  /** Como se muestra: con espacios. */
  telefono: string;
  /** Solo digitos con codigo de pais: lo que va en wa.me. */
  whatsapp: string;
  email: string;
  /** Vacia: el footer no muestra ese icono. */
  redes: { instagram: string; facebook: string };
  /** Ruta bajo /public de una foto del local. undefined: la seccion no muestra foto. */
  fotoLocal?: string;
}
