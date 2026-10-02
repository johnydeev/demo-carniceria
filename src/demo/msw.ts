/**
 * La API simulada. Mock Service Worker atiende en el navegador los `fetch` a
 * `/api/*` que ya hacen los componentes copiados, con los handlers de
 * `./handlers` (que llaman a `./servicios`, sobre el store).
 *
 * - `msw/browser` se importa dinamico, dentro de `arrancarDemo()`: importarlo
 *   arriba lo mete en el render del servidor y rompe el build.
 * - Recarga forzada (Shift+F5): el service worker queda registrado pero no
 *   controla la pagina. Se recarga una sola vez (marca en sessionStorage).
 * - Sin service worker (navegacion privada, cookies bloqueadas, sin HTTPS):
 *   respaldo que resuelve con `getResponse(handlers, request)` de msw, el
 *   mismo mecanismo que usan los tests.
 * - Mientras arranca, los `fetch` de la demo esperan `demoListo()`. No se tapa
 *   la pagina: solo se demora lo que pide datos.
 */
import type { RequestHandler } from 'msw';

type Resolver = (handlers: RequestHandler[], request: Request) => Promise<Response | undefined>;

const CLAVE_RECARGA = 'demo.msw.recargada';

/** Respaldo hasta que el worker confirme que controla la pagina. */
let modo: 'worker' | 'respaldo' = 'respaldo';
let manejadores: RequestHandler[] = [];
let resolver: Resolver | null = null;
let arrancada = false;
let avisarListo: () => void = () => {};
const listo = new Promise<void>((resolve) => {
  avisarListo = resolve;
});

/** Se resuelve cuando la API simulada ya atiende. */
export function demoListo(): Promise<void> {
  return listo;
}

/** Lo que atiende la demo: `/api/*` del propio sitio y la subida a Cloudinary. */
export function esDeLaDemo(url: URL, origen: string): boolean {
  if (url.hostname === 'api.cloudinary.com') return true;
  return url.origin === origen && url.pathname.startsWith('/api/');
}

function urlDe(input: RequestInfo | URL): URL {
  const texto = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  return new URL(texto, window.location.href);
}

/** Sin sessionStorage se da por recargada: mejor el respaldo que recargar en bucle. */
function yaSeRecargo(): boolean {
  try {
    return sessionStorage.getItem(CLAVE_RECARGA) === '1';
  } catch {
    return true;
  }
}

function marcarRecarga(recargada: boolean): void {
  try {
    if (recargada) sessionStorage.setItem(CLAVE_RECARGA, '1');
    else sessionStorage.removeItem(CLAVE_RECARGA);
  } catch {
    // Ver yaSeRecargo.
  }
}

// Corre al cargar el modulo, antes de que React hidrate: ningun fetch de la
// demo sale antes de que la API este lista. Los demas pasan sin tocarse.
if (typeof window !== 'undefined') {
  const original = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    let url: URL;
    try {
      url = urlDe(input);
    } catch {
      return original(input, init);
    }
    if (!esDeLaDemo(url, window.location.origin)) return original(input, init);

    await listo;
    if (modo === 'respaldo' && resolver) {
      const pedido = new Request(input, init);
      const respuesta = await resolver(manejadores, pedido.clone());
      if (respuesta) return respuesta;
      return original(pedido);
    }
    return original(input, init);
  };
}

/**
 * Una vez por carga de pagina. La llama `DemoArranque`.
 *
 * Todo va dentro de try/finally: pase lo que pase (no cargan los handlers, no
 * carga msw, el worker no arranca) `avisarListo()` se llama siempre y ningun
 * fetch queda esperando para siempre. Si fallaron los imports, `resolver`
 * queda en null y los fetch pasan a la red (responden 404, que los
 * componentes ya manejan); si fallo solo el worker, va el respaldo.
 */
export async function arrancarDemo(): Promise<void> {
  if (arrancada) return listo;
  arrancada = true;

  try {
    const [{ handlers }, { getResponse }] = await Promise.all([import('./handlers'), import('msw')]);
    manejadores = handlers;
    resolver = getResponse;

    if (!('serviceWorker' in navigator) || !window.isSecureContext) return;

    const { setupWorker } = await import('msw/browser');
    await setupWorker(...handlers).start({ onUnhandledRequest: 'bypass', quiet: true });

    if (navigator.serviceWorker.controller) {
      marcarRecarga(false);
      modo = 'worker';
      return;
    }
    // Recarga forzada: el worker no controla esta pagina. Una sola vez; mientras
    // la pagina se va, los fetch que salgan usan el respaldo.
    if (!yaSeRecargo()) {
      marcarRecarga(true);
      window.location.reload();
    }
  } catch (error) {
    console.warn('[demo] la API simulada arranco sin service worker:', error);
  } finally {
    avisarListo();
  }
}
