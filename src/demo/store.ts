/**
 * Estado de la demo en el navegador. Reemplaza a la base: cada visitante tiene
 * su copia en `localStorage` (`demo.estado`) y nadie ve la de otro.
 *
 * Se lee de `localStorage` en cada operacion, asi dos pestanas no se
 * desincronizan. Para no reparsear en cada render se guarda el ultimo texto
 * leido con su objeto: si el texto no cambio se devuelve el mismo objeto, que
 * es lo que necesita `useSyncExternalStore` (compara por identidad).
 *
 * La semilla se regenera sola si cambio la version (un deploy con datos
 * nuevos) o si es de otro dia argentino (UTC-3 fijo, como `src/lib/fechas.ts`):
 * asi los pedidos en curso tienen turno de hoy o manana y las metricas estan
 * al dia. Sin `localStorage` (navegacion privada estricta, almacenamiento
 * bloqueado, o lleno al guardar) la demo vive en memoria y se pierde al
 * recargar; la barra lo avisa.
 */
import { semilla, VERSION_DEMO } from './semilla.ts';
import type { EstadoDemo } from './tipos';

export const CLAVE_ESTADO = 'demo.estado';
/** Prefijo de los archivos que sube el visitante (fase 3): cada uno en su clave. */
export const PREFIJO_ARCHIVO = 'demo.archivo.';
/** Claves que la app copiada escribe por su cuenta. Se van con cada reinicio. */
export const CLAVES_APP = ['elancla.carrito', 'elancla.carrito.fusionDudosa', 'elancla.metricas.periodo'] as const;
/** Argentina no tiene horario de verano desde 2009: UTC-3 fijo. */
const OFFSET_ARGENTINA_MS = 3 * 60 * 60 * 1000;

export type AvisoDemo = 'regenerada' | 'sinAlmacenamiento';

const CLAVE_PRUEBA = 'demo.prueba';

let almacenResuelto: Storage | null | undefined;
let memoria: EstadoDemo | null = null;
let cache: { crudo: string; estado: EstadoDemo } | null = null;
let regenerada = false;
const oyentes = new Set<() => void>();

/**
 * `localStorage` si anda; null si no existe o el navegador no deja escribir
 * (Safari en privado lo expone pero tira al guardar). Se resuelve una vez.
 */
export function almacen(): Storage | null {
  if (almacenResuelto !== undefined) return almacenResuelto;
  try {
    const ls = globalThis.localStorage;
    if (!ls) {
      almacenResuelto = null;
    } else {
      ls.setItem(CLAVE_PRUEBA, '1');
      ls.removeItem(CLAVE_PRUEBA);
      almacenResuelto = ls;
    }
  } catch {
    almacenResuelto = null;
  }
  return almacenResuelto;
}

function avisar(): void {
  for (const oyente of oyentes) oyente();
}

/** "YYYY-MM-DD" del dia en hora argentina. Misma tecnica que `anioEnArgentina`. */
export function diaArgentino(fecha: Date): string {
  return new Date(fecha.getTime() - OFFSET_ARGENTINA_MS).toISOString().slice(0, 10);
}

/** Las listas que se recorren al dibujar: sin alguna, el estado no sirve. */
const LISTAS = ['productos', 'banners', 'usuarios', 'carrito', 'pedidos', 'eventos'] as const;

/**
 * Version al dia, forma completa y semilla del mismo dia argentino que `ahora`.
 * Una `semilladoEn` futura o ilegible no vale.
 */
export function estaVigente(valor: unknown, ahora: Date): valor is EstadoDemo {
  if (!valor || typeof valor !== 'object') return false;
  const e = valor as Partial<EstadoDemo>;
  if (e.version !== VERSION_DEMO || typeof e.semilladoEn !== 'string') return false;
  if (!LISTAS.every((campo) => Array.isArray(e[campo]))) return false;
  const sembrada = new Date(e.semilladoEn);
  const edad = ahora.getTime() - sembrada.getTime();
  if (!Number.isFinite(edad) || edad < 0) return false;
  return diaArgentino(sembrada) === diaArgentino(ahora);
}

function borrarClavesDeLaApp(ls: Storage): void {
  for (const clave of CLAVES_APP) ls.removeItem(clave);
  const archivos: string[] = [];
  for (let i = 0; i < ls.length; i++) {
    const clave = ls.key(i);
    if (clave?.startsWith(PREFIJO_ARCHIVO)) archivos.push(clave);
  }
  for (const clave of archivos) ls.removeItem(clave);
}

/**
 * Guarda en `localStorage`. Si tira (cuota llena), la demo pasa a memoria con
 * el cambio y la barra avisa "sin almacenamiento", como si nunca hubiera andado.
 */
function guardar(ls: Storage, estado: EstadoDemo): void {
  const crudo = JSON.stringify(estado);
  try {
    ls.setItem(CLAVE_ESTADO, crudo);
    cache = { crudo, estado };
  } catch {
    almacenResuelto = null;
    cache = null;
    memoria = estado;
  }
}

function sembrar(ls: Storage | null, ahora: Date): EstadoDemo {
  const nuevo = semilla(ahora);
  if (ls) {
    borrarClavesDeLaApp(ls);
    guardar(ls, nuevo);
  } else {
    memoria = nuevo;
  }
  return nuevo;
}

export function leer(ahora: Date = new Date()): EstadoDemo {
  const ls = almacen();
  if (!ls) {
    // Copias locales: TypeScript no estrecha bien las variables del modulo.
    const enMemoria = memoria;
    if (estaVigente(enMemoria, ahora)) return enMemoria;
    const nueva = semilla(ahora);
    memoria = nueva;
    return nueva;
  }

  const crudo = ls.getItem(CLAVE_ESTADO);
  const enCache = cache;
  if (crudo !== null && enCache && enCache.crudo === crudo && estaVigente(enCache.estado, ahora)) return enCache.estado;

  let previo: unknown = null;
  if (crudo !== null) {
    try {
      previo = JSON.parse(crudo);
    } catch {
      previo = null;
    }
  }
  if (crudo !== null && estaVigente(previo, ahora)) {
    cache = { crudo, estado: previo };
    return previo;
  }

  // Habia una demo guardada y no sirve: se avisa. La primera visita no es un reinicio.
  if (crudo !== null) {
    regenerada = true;
    // Despues: esta lectura puede venir del render de un componente.
    queueMicrotask(avisar);
  }
  return sembrar(ls, ahora);
}

export function escribir(estado: EstadoDemo): void {
  const ls = almacen();
  if (ls) guardar(ls, estado);
  else memoria = estado;
  avisar();
}

/**
 * Lee, aplica el cambio sobre una copia y la guarda. Devuelve lo que devuelve
 * el cambio. La copia hace que la lectura siguiente sea un objeto nuevo: los
 * componentes suscriptos se enteran. Si el cambio llama a `sinCambios()`, no se
 * escribe ni se avisa: como la app real, que solo escribe si hay algo que cambiar.
 */
export function modificar<T>(
  cambio: (estado: EstadoDemo, sinCambios: () => void) => T,
  ahora: Date = new Date(),
): T {
  const copia = structuredClone(leer(ahora));
  let hayCambios = true;
  const resultado = cambio(copia, () => {
    hayCambios = false;
  });
  if (hayCambios) escribir(copia);
  return resultado;
}

/** "Reiniciar demo": la semilla de hoy, sin el carrito local ni los archivos. */
export function reiniciar(ahora: Date = new Date()): EstadoDemo {
  regenerada = false;
  const nuevo = sembrar(almacen(), ahora);
  avisar();
  return nuevo;
}

/** Lo que la barra tiene que avisar, si algo. */
export function avisoDemo(): AvisoDemo | null {
  if (!almacen()) return 'sinAlmacenamiento';
  return regenerada ? 'regenerada' : null;
}

/** Para `useSyncExternalStore`: cambios de esta pestana y de otras. */
export function suscribir(oyente: () => void): () => void {
  oyentes.add(oyente);
  // Solo esta clave: escuchar cualquiera haria rebotar los avisos entre pestanas.
  const enOtraPestana = (e: StorageEvent) => {
    if (e.key === CLAVE_ESTADO || e.key === null) oyente();
  };
  if (typeof window !== 'undefined') window.addEventListener('storage', enOtraPestana);
  return () => {
    oyentes.delete(oyente);
    if (typeof window !== 'undefined') window.removeEventListener('storage', enOtraPestana);
  };
}

/** Solo para los tests: olvida lo resuelto y lo cacheado entre un caso y otro. */
export function soltarCache(): void {
  almacenResuelto = undefined;
  memoria = null;
  cache = null;
  regenerada = false;
}
