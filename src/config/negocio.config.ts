import type { NegocioConfig } from '@/types/negocio';

/**
 * Unico origen de los datos del negocio de la demo: un comercio de ejemplo.
 * Lo consumen Contacto, Footer, Nosotros, el slide de marca y la OG. El
 * horario no vive aca: sale del store (src/demo/servicios/horario.ts).
 */
export const negocio: NegocioConfig = {
  nombre: 'Carnicería La Esquina',
  claim: 'Carnicería, granja, fiambrería y almacén de barrio',
  fundado: 2001,
  direccion: {
    calle: 'Av. Belgrano 1450',
    localidad: 'Barrio Centro',
    provincia: 'Buenos Aires',
    cp: 'B0000',
    pais: 'AR',
  },
  geo: { lat: -34.6, lng: -58.4 },
  telefono: '+54 9 11 0000-0000',
  whatsapp: '5491100000000',
  email: 'hola@laesquina.demo',
  redes: { instagram: '', facebook: '' },
  fotoLocal: undefined,
};
