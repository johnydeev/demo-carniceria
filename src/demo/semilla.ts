/**
 * Datos iniciales de la demo. Deterministicos a partir de `ahora`: el mismo
 * `ahora` da la misma semilla, y los tests pueden comparar. No son identicos
 * entre visitantes: las fechas (pedidos, turnos, `semilladoEn`) dependen del
 * momento en que cada uno entra. Precios redondos e inventados; ningun dato de un comercio real.
 *
 * Los pedidos de dos meses (pedidosSemilla.ts) llegan en la fase 3: hasta
 * entonces la lista arranca vacia.
 */
import type { HorarioConfig } from '../lib/horario/esquema';
import type { ProductCategory } from '../lib/productCategories';
import type { BannerDemo, CobroVista, EstadoDemo, ProductoDemo, UnidadProducto, UsuarioDemo } from './tipos';

/** Subirla cuando cambian los datos iniciales: regenera la demo de quien ya entro. */
export const VERSION_DEMO = 1;

export const ID_DUENIO_DEMO = 'u-duenio';
export const ID_ENCARGADA_DEMO = 'u-encargada';
export const ID_CLIENTE_DEMO = 'u-cliente';
/** El dueño es la semilla: en la app real, ADMIN_SEMILLA_EMAIL. */
export const EMAIL_SEMILLA_DEMO = 'duenio@laesquina.demo';

const HORA_MS = 3_600_000;
const DIA_MS = 24 * HORA_MS;

interface DatosProducto {
  code: string;
  name: string;
  price: number;
  category: ProductCategory;
  unit: UnidadProducto;
  quantity: number;
  isOffer: boolean;
  pesoAprox: number | null;
  /** Nombre del archivo en /public/demo/productos, sin "-720.webp". */
  foto: string | null;
}

/** Por kilo, cantidad 1, sin oferta ni peso: el caso comun. `extra` pisa lo demas. */
function p(
  code: string,
  name: string,
  price: number,
  category: ProductCategory,
  foto: string | null,
  extra: Partial<DatosProducto> = {}
): DatosProducto {
  return { code, name, price, category, foto, unit: 'Kg', quantity: 1, isOffer: false, pesoAprox: null, ...extra };
}

const PRODUCTOS: DatosProducto[] = [
  // Carniceria: vacuno
  p('1001', 'Asado de tira', 13900, 'Carniceria', 'asado'),
  p('1002', 'Asado de tira x 3 kg', 37900, 'Carniceria', 'asado-plancha', { quantity: 3, isOffer: true }),
  p('1003', 'Vacío', 15900, 'Carniceria', 'vacio'),
  p('1004', 'Lomo', 21900, 'Carniceria', 'lomo'),
  p('1005', 'Paleta', 11900, 'Carniceria', 'paleta', { isOffer: true }),
  p('1006', 'Roast beef', 12500, 'Carniceria', 'roast-beef'),
  p('1007', 'Falda', 7900, 'Carniceria', 'falda'),
  p('1008', 'Osobuco', 7500, 'Carniceria', 'osobuco'),
  p('1009', 'Costillar', 12900, 'Carniceria', 'costillar'),
  p('1010', 'Picada especial', 10900, 'Carniceria', 'picada-premium'),
  // Carniceria: cerdo
  p('2001', 'Bondiola', 11500, 'Carniceria', 'bondiola'),
  p('2002', 'Pechito de cerdo', 9900, 'Carniceria', 'pechito', { isOffer: true }),
  p('2003', 'Costillitas de cerdo', 10500, 'Carniceria', 'costillitas'),
  p('2004', 'Ribs de cerdo', 12900, 'Carniceria', 'ribs'),
  p('2005', 'Cortes de cerdo surtidos', 9500, 'Carniceria', 'cortes-de-cerdo'),
  p('2006', 'Picada de cerdo', 8900, 'Carniceria', 'picada-cerdo'),
  // Pieza de peso variable: precio por kilo, se pide de a una y se estima con el peso.
  p('2007', 'Lechón (pieza)', 9900, 'Carniceria', 'lechon', { pesoAprox: 8 }),
  // Carniceria: achuras
  p('3001', 'Mondongo', 5900, 'Carniceria', 'mondongo'),
  p('3002', 'Rabo', 6900, 'Carniceria', 'rabo'),
  p('3003', 'Rabito, huesito y cuerito', 4500, 'Carniceria', 'rabito-huesito-cuerito'),
  // Granja
  p('4001', 'Suprema', 8900, 'Granja', 'suprema'),
  p('4002', 'Pata y muslo', 4900, 'Granja', 'pata-muslo'),
  // Pack por kilo a precio cerrado: Kg + cantidad 3, sin peso.
  p('4003', 'Pata y muslo x 3 kg', 12900, 'Granja', 'pata-muslo', { quantity: 3, isOffer: true }),
  p('4004', 'Alitas', 3900, 'Granja', 'alitas'),
  // Caja: siempre precio cerrado (decision del dueño de la app real): Kg + kilos que trae.
  p('4005', 'Suprema por caja (15 kg)', 120000, 'Granja', 'suprema-caja', { quantity: 15 }),
  p('4006', 'Pata y muslo por caja (10 kg)', 42000, 'Granja', 'pata-muslo-caja', { quantity: 10 }),
  // Fiambreria y almacen: sin foto, el catalogo dibuja el marcador.
  p('5001', 'Jamón cocido', 14900, 'Fiambreria', null),
  p('5002', 'Queso de máquina', 12900, 'Fiambreria', null),
  p('6001', 'Huevos', 3500, 'Almacen', null, { unit: 'Docena' }),
  p('6002', 'Aceite de girasol 1,5 L', 3900, 'Almacen', null, { unit: 'Unidad' }),
];

function productos(ahora: Date): ProductoDemo[] {
  return PRODUCTOS.map((d, i) => ({
    id: `p-${String(i + 1).padStart(2, '0')}`,
    code: d.code,
    name: d.name,
    price: d.price,
    imageUrl: d.foto ? `/demo/productos/${d.foto}-720.webp` : null,
    imagePublicId: null,
    category: d.category,
    stock: null,
    description: null,
    unit: d.unit,
    quantity: d.quantity,
    isOffer: d.isOffer,
    isPublished: true,
    pesoAprox: d.pesoAprox,
    priceUpdatedAt: ahora.toISOString(),
    // Uno por hora hacia atras: el catalogo (createdAt desc) queda en el orden de la lista.
    createdAt: new Date(ahora.getTime() - i * HORA_MS).toISOString(),
  }));
}

const CARTELES = [
  { archivo: 'cartel-asado', alt: 'Asado para el fin de semana', linkUrl: '/productos/carniceria' },
  { archivo: 'cartel-pollo', alt: 'Pollo fresco todos los días', linkUrl: '/productos/granja' },
  { archivo: 'cartel-pedidos', alt: 'Pedí por la web y retirá sin esperar', linkUrl: '/productos' },
];

/**
 * `imagePublicId` dentro de `elancla/banners/` para que las reglas de la fase 3
 * (`crearBanner`, duplicados) lo traten como cualquier cartel; lo que se dibuja
 * es `imageUrl`, la imagen generada por scripts/imagenes-demo.mjs.
 */
function carteles(ahora: Date): BannerDemo[] {
  return CARTELES.map((c, i) => ({
    id: `b-${i + 1}`,
    imagePublicId: `elancla/banners/${c.archivo}`,
    imageUrl: `/demo/carteles/${c.archivo}.webp`,
    alt: c.alt,
    linkUrl: c.linkUrl,
    order: i,
    isActive: true,
    startsAt: null,
    endsAt: null,
    createdAt: new Date(ahora.getTime() - (i + 1) * DIA_MS).toISOString(),
  }));
}

const MANANA = { abre: '08:30', cierra: '13:00' };
const TARDE = { abre: '17:00', cierra: '20:30' };

/** Mañana y tarde de martes a sábado, domingo a la mañana, lunes cerrado. */
export const HORARIO_DEMO: HorarioConfig = {
  semana: {
    lunes: [],
    martes: [MANANA, TARDE],
    miercoles: [MANANA, TARDE],
    jueves: [MANANA, TARDE],
    viernes: [MANANA, TARDE],
    sabado: [MANANA, TARDE],
    domingo: [{ abre: '09:00', cierra: '13:00' }],
  },
  margenRetiroMin: 30,
  margenEnvioMin: 90,
  diasAnticipacion: 3,
  fechasCerradas: [],
};

/** El primero es "Cliente Demo", el que se usa con el rol Cliente de la barra. */
const CLIENTES: ReadonlyArray<readonly [string, string]> = [
  ['Cliente Demo', 'cliente@laesquina.demo'],
  ['Marta Gómez', 'marta.gomez@ejemplo.demo'],
  ['Julián Pereyra', 'julian.pereyra@ejemplo.demo'],
  ['Sofía Benítez', 'sofia.benitez@ejemplo.demo'],
  ['Diego Ramírez', 'diego.ramirez@ejemplo.demo'],
  ['Lucía Fernández', 'lucia.fernandez@ejemplo.demo'],
  ['Carlos Medina', 'carlos.medina@ejemplo.demo'],
  ['Valeria Sosa', 'valeria.sosa@ejemplo.demo'],
  ['Martín Acosta', 'martin.acosta@ejemplo.demo'],
  ['Paula Herrera', 'paula.herrera@ejemplo.demo'],
  ['Nicolás Ríos', 'nicolas.rios@ejemplo.demo'],
  ['Florencia Díaz', 'florencia.diaz@ejemplo.demo'],
  ['Andrés Molina', 'andres.molina@ejemplo.demo'],
  ['Camila Torres', 'camila.torres@ejemplo.demo'],
  ['Rodrigo Vega', 'rodrigo.vega@ejemplo.demo'],
];

/** El que aparece desactivado en Usuarios (fase 3). Nunca el Cliente Demo. */
const CLIENTE_DESACTIVADO = 9;

function usuarios(ahora: Date): UsuarioDemo[] {
  const haceDias = (dias: number) => new Date(ahora.getTime() - dias * DIA_MS).toISOString();
  const ultimo = CLIENTES.length - 1;

  const equipo: UsuarioDemo[] = [
    {
      id: ID_DUENIO_DEMO,
      email: EMAIL_SEMILLA_DEMO,
      name: 'Dueño Demo',
      role: 'admin',
      image: null,
      phone: '11 5555 0001',
      address: null,
      addressNotes: null,
      isActive: true,
      createdAt: haceDias(90),
    },
    {
      id: ID_ENCARGADA_DEMO,
      email: 'encargada@laesquina.demo',
      name: 'Encargada Demo',
      role: 'admin',
      image: null,
      phone: '11 5555 0002',
      address: null,
      addressNotes: null,
      isActive: true,
      createdAt: haceDias(80),
    },
  ];

  // Altas repartidas en los dos meses: la primera hace 60 dias, la ultima hoy.
  const clientes: UsuarioDemo[] = CLIENTES.map(([name, email], i) => ({
    id: i === 0 ? ID_CLIENTE_DEMO : `u-c${String(i).padStart(2, '0')}`,
    email,
    name,
    role: 'user',
    image: null,
    // 10 digitos con codigo de area: los acepta numeroWhatsApp.
    phone: `11 5555 ${String(100 + i).padStart(4, '0')}`,
    address: `Calle de Ejemplo ${100 + i * 7}`,
    addressNotes: i % 3 === 0 ? 'Timbre B' : null,
    isActive: i !== CLIENTE_DESACTIVADO,
    createdAt: haceDias(Math.round((60 * (ultimo - i)) / ultimo)),
  }));

  return [...equipo, ...clientes];
}

function cobro(ahora: Date): CobroVista {
  return {
    alias: 'la.esquina.demo',
    titular: 'Carnicería La Esquina',
    maxArchivoMB: 5,
    actualizadoPor: EMAIL_SEMILLA_DEMO,
    updatedAt: ahora.toISOString(),
  };
}

export function semilla(ahora: Date): EstadoDemo {
  return {
    version: VERSION_DEMO,
    semilladoEn: ahora.toISOString(),
    productos: productos(ahora),
    banners: carteles(ahora),
    usuarios: usuarios(ahora),
    carrito: [],
    pedidos: [],
    eventos: [],
    siguienteNumeroPedido: 1,
    horario: structuredClone(HORARIO_DEMO),
    cobro: cobro(ahora),
  };
}
