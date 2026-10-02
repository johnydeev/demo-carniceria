/**
 * Tipos de la demo.
 *
 * La primera parte son los que en la app real viven en `src/services/`, que la
 * demo no tiene: mismo nombre y misma forma, para que los componentes copiados
 * solo cambien el import. El origen de cada uno esta en SINCRONIZAR.md.
 *
 * La segunda es la forma del estado que guarda `store.ts`: lo que en la app
 * real son las tablas de Prisma, con las fechas como texto ISO (va a JSON).
 */
import type { ConfigCobro } from '../lib/orders/cobro';
import type { EstadoPedido, MetodoPago } from '../lib/orders/estados';
import type { PedidoParaMensaje } from '../lib/orders/mensaje';
import type { HorarioConfig } from '../lib/horario/esquema';
import type { ProductCategory } from '../lib/productCategories';

// ---------------------------------------------------------------------------
// Tipos que vivian en services/
// ---------------------------------------------------------------------------

/** De orders.service.ts. Un pedido ya listo para dibujar o mandar por WhatsApp. */
export interface PedidoVista extends PedidoParaMensaje {
  id: string;
  status: EstadoPedido;
  createdAt: string;
  userId: string;
  /** Para que el historial del panel se vuelva a pedir despues de cada accion. */
  updatedAt: string;
  customerEmail?: string;
  /** Direccion del perfil del cliente: la precarga "Cambiar tipo de envío" del panel. */
  perfilDireccion: { address: string | null; addressNotes: string | null };
  metodoPagoElegido: MetodoPago | null;
  metodoPago: MetodoPago | null;
  /** Null sin ticket. No pasa por toNumber: convertiria null en 0 y el detalle diria "Total a pagar $ 0". */
  montoReal: number | null;
  entregadoEn: string | null;
  motivoCancelacion: string | null;
  /** Booleanos, nunca los public_id: esta vista viaja al navegador. */
  tieneTicket: boolean;
  tieneComprobante: boolean;
}

/** De orders.service.ts. */
export interface EventoVista {
  id: string;
  /** Null: un cambio sin transicion (corregir ticket, cambiar modalidad). */
  estado: EstadoPedido | null;
  nota: string | null;
  creadoEn: string;
  /** Nombre o email del admin; null si ya no existe. */
  admin: string | null;
}

/** De cobro.service.ts. */
export interface CobroVista extends ConfigCobro {
  /** Email del admin que lo cambio por ultima vez. */
  actualizadoPor: string | null;
  updatedAt: string | null;
}

/** De cuenta.service.ts. */
export interface Perfil {
  name: string;
  email: string;
  image: string | null;
  phone: string;
  address: string;
  addressNotes: string;
}

/** De archivosPedido.service.ts. */
export interface FirmaSubida {
  timestamp: number;
  signature: string;
  apiKey: string;
  cloudName: string;
  folder: string;
  /** Sin la carpeta: Cloudinary la antepone ("carpeta/pedido-3-ticket-..."). */
  public_id: string;
  overwrite: 'false';
  type: 'authenticated';
  allowed_formats: string;
  /** El navegador chequea el tamano antes de subir. */
  maxBytes: number;
}

/** De admins.service.ts. */
export interface AdminVista {
  id: string;
  email: string;
  name: string | null;
  semilla: boolean;
  /**
   * Agregado por email y nunca entro: Google le carga nombre y foto al primer
   * ingreso. Sirve para ver un email mal tipeado antes de que alguien lo reclame.
   */
  pendiente: boolean;
}

// ---------------------------------------------------------------------------
// Estado de la demo (lo que en la app real son tablas)
// ---------------------------------------------------------------------------

export type UnidadProducto = 'Kg' | 'Unidad' | 'Docena' | 'Caja';

/** Fila de `Product`. El precio es numero: la demo no tiene Decimal. */
export interface ProductoDemo {
  id: string;
  code: string;
  name: string;
  price: number;
  /** Ruta de /public o data URL. */
  imageUrl: string | null;
  imagePublicId: string | null;
  category: ProductCategory;
  stock: string | null;
  description: string | null;
  unit: UnidadProducto;
  quantity: number;
  isOffer: boolean;
  isPublished: boolean;
  pesoAprox: number | null;
  priceUpdatedAt: string | null;
  createdAt: string;
}

/** Fila de `Banner`. `imageUrl` es lo que se dibuja: ruta de /public o data URL. */
export interface BannerDemo {
  id: string;
  /** Dentro de `elancla/banners/`, como exige `crearBanner` (fase 3). */
  imagePublicId: string;
  imageUrl: string;
  alt: string;
  linkUrl: string | null;
  order: number;
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
}

/** Fila de `User`. */
export interface UsuarioDemo {
  id: string;
  email: string;
  name: string | null;
  role: 'admin' | 'user';
  image: string | null;
  phone: string | null;
  address: string | null;
  addressNotes: string | null;
  isActive: boolean;
  createdAt: string;
}

/**
 * Fila de `CartItem`. Sin `updatedAt`: el orden del arreglo es el orden
 * (lo ultimo escrito, primero), como el `orderBy: updatedAt desc` de la base.
 */
export interface FilaCarrito {
  userId: string;
  productId: string;
  quantity: number;
}

/**
 * Fila de `Order`. Guarda los `public_id` de los archivos; la vista que viaja
 * a los componentes (`PedidoVista`) solo dice si los tiene. Se llena en la
 * fase 2 (pedidos del cliente) y la fase 3 (semilla de dos meses).
 */
export interface PedidoDemo
  extends Omit<PedidoVista, 'customerEmail' | 'perfilDireccion' | 'tieneTicket' | 'tieneComprobante'> {
  ticketPublicId: string | null;
  ticketFormato: string | null;
  comprobantePublicId: string | null;
  comprobanteFormato: string | null;
}

/** Fila de `OrderEvento`. */
export interface EventoDemo {
  id: string;
  orderId: string;
  estado: EstadoPedido | null;
  nota: string | null;
  adminId: string | null;
  /** El ticket reemplazado por "Corregir ticket": cuenta como en uso. */
  archivoAnterior: string | null;
  creadoEn: string;
}

export interface EstadoDemo {
  /** Cambia con los datos iniciales: otra version regenera la demo del visitante. */
  version: number;
  /** ISO. Si es de otro dia argentino (UTC-3 fijo), la demo se regenera con datos de hoy. */
  semilladoEn: string;
  productos: ProductoDemo[];
  banners: BannerDemo[];
  usuarios: UsuarioDemo[];
  carrito: FilaCarrito[];
  pedidos: PedidoDemo[];
  eventos: EventoDemo[];
  /** El "Pedido #N" del proximo pedido (el autoincremental de la base). */
  siguienteNumeroPedido: number;
  horario: HorarioConfig;
  cobro: CobroVista;
}
