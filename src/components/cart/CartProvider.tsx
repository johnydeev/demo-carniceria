'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useSession } from '@/demo/sesion';
import type { ItemCarrito, LineaCarrito, ProductoCarrito } from '@/lib/cart/types';
import { ajustar, precioEfectivo } from '@/lib/cart/cantidades';
import { totalEstimado } from '@/lib/cart/total';

const CLAVE_LOCAL = 'elancla.carrito';
/**
 * Marca de que una fusion termino sin saber si se aplico (red caida, respuesta
 * perdida, 5xx). Vive al lado del carrito local para sobrevivir a recargar la
 * pagina: mientras este, el reintento fusiona con `maximo` y no suma de nuevo.
 */
const CLAVE_FUSION_DUDOSA = 'elancla.carrito.fusionDudosa';

interface CarritoContexto {
  lineas: LineaCarrito[];
  cantidadLineas: number;
  total: number;
  hayNoDisponibles: boolean;
  cargando: boolean;
  /** Ids con una escritura en curso, para el spinner del boton. */
  pendientes: Set<string>;
  error: string | null;
  cantidadDe: (productId: string) => number;
  /** Cero quita la linea. `producto` permite dibujar la linea sin esperar al servidor. */
  poner: (productId: string, quantity: number, producto?: ProductoCarrito) => Promise<void>;
  quitar: (productId: string) => Promise<void>;
  /**
   * Vacia el carrito **solo en el cliente**, para despues de crear un pedido:
   * `POST /api/orders` ya borro las filas en la misma transaccion, asi que no
   * hay nada que pedirle al servidor. Una escritura en vuelo que falle despues
   * no revierte nada.
   */
  vaciar: () => void;
  /** Vuelve a leer el carrito (base o catalogo). */
  recargar: () => void;
  /** El catalogo no respondio: lineas conservadas pero sin datos del producto. */
  cargaFallida: boolean;
  /**
   * La ultima carga con sesion fallo (la fusion o `GET /api/cart`, tipico con
   * la base dormida): `lineas` no es el carrito real y cero lineas no quiere
   * decir vacio. Sigue en true mientras se reintenta y baja recien con una
   * carga buena. A diferencia de `error`, no lo prende una escritura fallida.
   */
  cargaConError: boolean;
  abierto: boolean;
  abrir: () => void;
  cerrar: () => void;
}

/** Valor por defecto: fuera del provider (panel admin) el carrito no hace nada. */
const SIN_CARRITO: CarritoContexto = {
  lineas: [],
  cantidadLineas: 0,
  total: 0,
  hayNoDisponibles: false,
  cargando: false,
  pendientes: new Set(),
  error: null,
  cantidadDe: () => 0,
  poner: async () => {},
  quitar: async () => {},
  vaciar: () => {},
  recargar: () => {},
  cargaFallida: false,
  cargaConError: false,
  abierto: false,
  abrir: () => {},
  cerrar: () => {},
};

const Contexto = createContext<CarritoContexto>(SIN_CARRITO);

export const useCarrito = () => useContext(Contexto);

function leerLocal(): ItemCarrito[] {
  try {
    const crudo = localStorage.getItem(CLAVE_LOCAL);
    if (!crudo) return [];
    const parsed = JSON.parse(crudo);
    return Array.isArray(parsed?.items) ? parsed.items : [];
  } catch {
    return [];
  }
}

function escribirLocal(items: ItemCarrito[]): void {
  // Sin items no hay nada que fusionar: se va tambien la marca de fusion
  // dudosa, que si no quedaba huerfana y la primera fusion de la proxima
  // sesion iba por maximo en vez de sumar.
  if (items.length === 0) {
    borrarLocal();
    return;
  }
  try {
    localStorage.setItem(CLAVE_LOCAL, JSON.stringify({ items }));
  } catch {
    // Sin localStorage el carrito vive en memoria y se pierde al recargar.
  }
}

/** Sin local no hay nada que fusionar: la marca de fusion dudosa se va con el. */
function borrarLocal(): void {
  try {
    localStorage.removeItem(CLAVE_LOCAL);
    localStorage.removeItem(CLAVE_FUSION_DUDOSA);
  } catch {
    // idem
  }
}

function leerFusionDudosa(): boolean {
  try {
    return localStorage.getItem(CLAVE_FUSION_DUDOSA) === '1';
  } catch {
    return false;
  }
}

function guardarFusionDudosa(): void {
  try {
    localStorage.setItem(CLAVE_FUSION_DUDOSA, '1');
  } catch {
    // Sin localStorage la marca vive solo en el ref: alcanza para "Reintentar".
  }
}

/**
 * Estado del carrito. Sin sesion vive en localStorage y resuelve los
 * productos contra /api/catalog; con sesion vive en la base via /api/cart.
 * Al detectar sesion con items locales, los fusiona una sola vez.
 */
export default function CartProvider({ children }: { children: React.ReactNode }) {
  const { status, data: session } = useSession();
  // Una cuenta desactivada conserva el token hasta que vence, pero el servidor
  // ya la rechaza: el carrito la trata como visitante.
  const conSesion = status === 'authenticated' && !session?.user?.bloqueado;

  const [lineas, setLineas] = useState<LineaCarrito[]>([]);
  const [cargando, setCargando] = useState(true);
  const [pendientes, setPendientes] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [abierto, setAbierto] = useState(false);
  /** El catalogo no respondio: las lineas sin producto no son "no disponibles", son desconocidas. */
  const [cargaFallida, setCargaFallida] = useState(false);
  const [cargaConError, setCargaConError] = useState(false);
  /** Sube con `recargar()`: vuelve a correr la carga. */
  const [recarga, setRecarga] = useState(0);
  const fusionHecha = useRef(false);
  /**
   * Un intento de fusion termino sin saber si se aplico. Copia en memoria de
   * `CLAVE_FUSION_DUDOSA`, por si localStorage no anda.
   */
  const fusionDudosa = useRef(false);
  /**
   * Copia sincronica de `lineas`. Dos clics seguidos antes del re-render
   * leerian la misma foto desde el closure y el segundo pisaria al primero,
   * en memoria y en localStorage. Toda escritura pasa por `fijar`.
   */
  const lineasRef = useRef<LineaCarrito[]>([]);
  const cargandoRef = useRef(true);
  /** Copia sincronica de `cargaConError`, para el candado de `poner`. */
  const cargaConErrorRef = useRef(false);
  /** Sube con `vaciar()`: una escritura que falla despues no resucita lineas de antes del pedido. */
  const generacion = useRef(0);

  const fijar = useCallback((siguiente: LineaCarrito[]) => {
    lineasRef.current = siguiente;
    setLineas(siguiente);
  }, []);

  const fijarCargaConError = useCallback((valor: boolean) => {
    cargaConErrorRef.current = valor;
    setCargaConError(valor);
  }, []);

  const marcarPendiente = (id: string, valor: boolean) =>
    setPendientes((prev) => {
      const s = new Set(prev);
      if (valor) s.add(id);
      else s.delete(id);
      return s;
    });

  // Carga inicial y cambio de sesion.
  useEffect(() => {
    if (status === 'loading') return;
    let vivo = true;

    async function cargar() {
      cargandoRef.current = true;
      setCargando(true);
      setError(null);
      setCargaFallida(false);
      try {
        if (conSesion) {
          const local = leerLocal();
          if (local.length > 0 && !fusionHecha.current) {
            // Se marca antes del fetch para que una segunda carga en vuelo no
            // fusione dos veces; si falla, se desmarca y el local se reintenta.
            fusionHecha.current = true;
            // Si un intento anterior quedo dudoso, el servidor pudo haber sumado
            // ya el local: se fusiona por maximo, que no duplica (ver `ModoFusion`).
            const dudosa = fusionDudosa.current || leerFusionDudosa();
            const marcarDudosa = () => {
              fusionDudosa.current = true;
              guardarFusionDudosa();
            };
            try {
              let res: Response;
              try {
                res = await fetch('/api/cart/merge', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ items: local, modo: dudosa ? 'maximo' : 'suma' }),
                });
              } catch (e) {
                // Error de red: el pedido pudo haber llegado y aplicarse.
                marcarDudosa();
                throw e;
              }
              if (!res.ok) {
                const cuerpo = await res.json().catch(() => ({}));
                if (res.status < 500) {
                  // Un 4xx es un rechazo claro y definitivo (un local que no pasa
                  // la validacion: demasiados productos, un item corrupto).
                  // Reintentar daria lo mismo y dejaba el carrito bloqueado: se
                  // descarta el local y se sigue con el de la cuenta.
                  borrarLocal();
                  fusionDudosa.current = false;
                  const r = await fetch('/api/cart');
                  if (!r.ok) throw new Error('cart');
                  const d = await r.json();
                  if (vivo) {
                    fijar(d.lineas);
                    fijarCargaConError(false);
                    setError('No pudimos sumar los productos que tenías guardados sin cuenta.');
                  }
                  return;
                }
                // Un 5xx pudo pasar despues de escribir, salvo que el servidor
                // diga que no aplico nada (fallo la lectura previa).
                if (cuerpo.aplicado !== false) marcarDudosa();
                throw new Error('merge');
              }
              let data: { lineas: LineaCarrito[] };
              try {
                data = await res.json();
              } catch (e) {
                // Respondio 2xx: se aplico, pero sin el cuerpo no hay lineas que
                // mostrar y el local sigue. El reintento no tiene que volver a sumar.
                marcarDudosa();
                throw e;
              }
              // Fusion buena: se van el local y la marca de dudosa juntos.
              borrarLocal();
              fusionDudosa.current = false;
              if (vivo) {
                fijar(data.lineas);
                fijarCargaConError(false);
              }
            } catch (e) {
              fusionHecha.current = false;
              throw e;
            }
          } else {
            const res = await fetch('/api/cart');
            if (!res.ok) throw new Error('cart');
            const data = await res.json();
            if (vivo) {
              fijar(data.lineas);
              fijarCargaConError(false);
            }
          }
        } else {
          fusionHecha.current = false;
          // Sin sesion el carrito es el localStorage: siempre se sabe que hay.
          // Si falla el catalogo, lo cubre `cargaFallida`.
          fijarCargaConError(false);
          const local = leerLocal();
          if (local.length === 0) {
            if (vivo) fijar([]);
          } else {
            const ids = local.map((i) => i.productId).join(',');
            const res = await fetch(`/api/catalog?ids=${encodeURIComponent(ids)}`).catch(() => null);
            if (!res || !res.ok) {
              // Sin catalogo no se sabe que esta disponible. Antes caia a una
              // lista vacia: todas las lineas se veian "ya no disponible", el
              // cliente las quitaba y se borraban del localStorage para siempre.
              // Se conservan tal cual y se avisa.
              if (vivo) {
                fijar(local.map((i) => ({ ...i, producto: null })));
                setCargaFallida(true);
                setError('No pudimos cargar los productos de tu carrito. Probá recargar la página.');
              }
              return;
            }
            const data = await res.json();
            const porId = new Map<string, ProductoCarrito>(
              (data.productos as ProductoCarrito[]).map((p) => [p.id, p])
            );
            // La cantidad se reajusta a la regla vigente, como en el servidor: si
            // el dueno cambio como se vende un producto, el carrito no muestra
            // una cantidad y un subtotal que el pedido despues corrige.
            if (vivo)
              fijar(
                local.map((i) => {
                  const producto = porId.get(i.productId) ?? null;
                  return { ...i, quantity: producto ? ajustar(i.quantity, producto) : i.quantity, producto };
                })
              );
          }
        }
      } catch {
        // `cargaConError` no se baja al empezar una carga, solo con una buena:
        // mientras se reintenta, /pedido sigue mostrando el aviso con el boton
        // girando, no "Tu carrito esta vacio". Si fallo la fusion, el local
        // sigue intacto y `fusionHecha` en false: el reintento vuelve a fusionar,
        // por maximo si el intento quedo dudoso.
        if (vivo) {
          setError('No pudimos cargar tu carrito.');
          fijarCargaConError(true);
        }
      } finally {
        if (vivo) {
          cargandoRef.current = false;
          setCargando(false);
        }
      }
    }

    cargar();
    return () => {
      vivo = false;
    };
  }, [status, conSesion, fijar, fijarCargaConError, recarga]);

  const cantidadDe = useCallback(
    (productId: string) => lineas.find((l) => l.productId === productId)?.quantity ?? 0,
    [lineas]
  );

  const poner = useCallback(
    async (productId: string, quantity: number, producto?: ProductoCarrito) => {
      // Mientras carga, `lineas` todavia no es el carrito real: escribir sobre
      // esa foto pisaria el localStorage, y la respuesta de la carga pisaria
      // la escritura. Los botones se deshabilitan; esto es el candado.
      if (cargandoRef.current) return;
      // Con la carga fallida tampoco: si la fusion no paso, el local sigue
      // esperando, y un PUT ahora mas la fusion del reintento sumaria dos veces
      // el mismo producto. Primero hay que reintentar la carga.
      if (cargaConErrorRef.current) {
        setError('No pudimos cargar tu carrito. Reintentá antes de cambiarlo.');
        return;
      }

      const anterior = lineasRef.current;
      const posicion = anterior.findIndex((l) => l.productId === productId);
      const previa = posicion >= 0 ? anterior[posicion] : null;
      const regla = producto ?? previa?.producto ?? null;
      const ajustada = quantity <= 0 ? 0 : regla ? ajustar(quantity, regla) : quantity;

      // Optimista: la UI cambia ya; si el servidor falla, se vuelve atras.
      const siguiente: LineaCarrito[] =
        ajustada === 0
          ? anterior.filter((l) => l.productId !== productId)
          : previa
            ? anterior.map((l) =>
                l.productId === productId ? { ...l, quantity: ajustada, producto: l.producto ?? regla } : l
              )
            : // La linea nueva va primero: el drawer se abre y se ve lo recien agregado.
              [{ productId, quantity: ajustada, producto: regla }, ...anterior];
      fijar(siguiente);
      setError(null);

      if (!conSesion) {
        escribirLocal(siguiente.map(({ productId, quantity }) => ({ productId, quantity })));
        return;
      }

      const gen = generacion.current;
      marcarPendiente(productId, true);
      try {
        const res =
          ajustada === 0
            ? await fetch(`/api/cart/${productId}`, { method: 'DELETE' })
            : await fetch(`/api/cart/${productId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ quantity: ajustada }),
              });
        if (!res.ok) throw new Error('put');
      } catch {
        // Se revierte solo esta linea y sobre el estado actual: restaurar la
        // foto entera desharia otras escrituras que si se guardaron. Despues
        // de `vaciar()` no se revierte nada: el pedido ya se llevo el carrito.
        if (gen === generacion.current) {
          const sin = lineasRef.current.filter((l) => l.productId !== productId);
          if (previa) sin.splice(Math.min(posicion, sin.length), 0, previa);
          fijar(sin);
          setError('No pudimos guardar el cambio. Probá de nuevo.');
        }
      } finally {
        marcarPendiente(productId, false);
      }
    },
    [conSesion, fijar]
  );

  const quitar = useCallback((productId: string) => poner(productId, 0), [poner]);

  // Sin esto, las lineas sobreviven al pedido: `router.refresh()` revalida los
  // Server Components pero conserva el estado de los componentes cliente, y el
  // provider no se remonta en una navegacion del lado del cliente. Peor que
  // cosmetico: `ponerEnCarrito` hace upsert, asi que tocar el stepper de una
  // linea fantasma recreaba la fila en la base.
  const vaciar = useCallback(() => {
    generacion.current += 1;
    fijar([]);
    setError(null);
    borrarLocal();
    fusionDudosa.current = false;
  }, [fijar]);

  // Estables a proposito: CartDrawer enfoca el panel en un efecto que depende
  // de `cerrar`. Una funcion nueva por render le robaba el foco al stepper en
  // cada toque (la misma trampa que tuvo AdminModal).
  const abrir = useCallback(() => setAbierto(true), []);
  // Despues de un 409 del pedido (un producto dejo de estar disponible), el
  // contexto seguia mostrando las lineas como disponibles y reintentar daba el
  // mismo error. Recargar trae el estado real de la base y del catalogo.
  const recargar = useCallback(() => setRecarga((n) => n + 1), []);
  const cerrar = useCallback(() => setAbierto(false), []);

  const total = useMemo(
    () =>
      totalEstimado(
        lineas.map((l) => ({
          // Una pieza vale precio por kilo por el peso aproximado: estimado.
          price: l.producto ? precioEfectivo(l.producto.price, l.producto) : 0,
          quantity: l.quantity,
          disponible: Boolean(l.producto?.disponible),
        }))
      ),
    [lineas]
  );

  const hayNoDisponibles = lineas.some((l) => !l.producto?.disponible);

  const valor: CarritoContexto = {
    lineas,
    cantidadLineas: lineas.length,
    total,
    hayNoDisponibles,
    cargando,
    pendientes,
    error,
    cantidadDe,
    poner,
    quitar,
    vaciar,
    recargar,
    cargaFallida,
    cargaConError,
    abierto,
    abrir,
    cerrar,
  };

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}
