import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import type { HttpHandler } from 'msw';
import { handlers } from './index.ts';

const SRC = path.resolve(import.meta.dirname, '..', '..');

/**
 * Rutas que algun componente pide y la demo todavia no atiende. Cada fase
 * saca las suyas al agregar el handler. Una ruta que no esta ni aca ni en los
 * handlers hace fallar el test: es un `fetch` nuevo en la app copiada.
 */
const PENDIENTES: Record<string, 'fase 2' | 'fase 3'> = {
  '/api/cuenta': 'fase 2',
  '/api/orders': 'fase 2',
  '/api/products': 'fase 3',
  '/api/products/:param': 'fase 3',
  '/api/admin/catalog-diagnostics': 'fase 3',
  '/api/cloudinary/signature': 'fase 3',
  'https://api.cloudinary.com/v1_1/:param/image/upload': 'fase 3',
  '/api/admin/banners': 'fase 3',
  '/api/admin/banners/:param': 'fase 3',
  '/api/admin/cobro': 'fase 3',
  '/api/admin/horario': 'fase 3',
  '/api/admin/orders': 'fase 3',
  '/api/admin/orders/:param': 'fase 3',
  '/api/admin/orders/:param/eventos': 'fase 3',
  '/api/admin/users': 'fase 3',
  '/api/admin/users/:param': 'fase 3',
  '/api/admin/admins': 'fase 3',
  '/api/admin/admins/:param': 'fase 3',
};

/** `.ts` y `.tsx` de src/, sin los tests (que arman URLs a proposito). */
function archivos(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const ruta = path.join(dir, e.name);
    if (e.isDirectory()) return archivos(ruta);
    return (e.name.endsWith('.ts') || e.name.endsWith('.tsx')) && !e.name.endsWith('.test.ts') ? [ruta] : [];
  });
}

/**
 * Una forma para las dos maneras de escribir una ruta: `/api/cart/${id}` en el
 * componente y `*\/api/cart/:productId` en el handler quedan `/api/cart/:param`.
 * Sin query string.
 */
function normalizar(url: string): string {
  return url
    .replace(/\$\{[^}]*\}/g, ':param')
    .replace(/:[A-Za-z]\w*/g, ':param')
    .split('?')[0]
    .replace(/^\*/, '');
}

const LLAMADA_LITERAL = /fetch\(\s*(?:'([^']*)'|"([^"]*)"|`([^`]*)`)/g;
// Sin bandera g: se usa con .test en varios archivos y lastIndex quedaria corrido.
const LLAMADA_SIN_LITERAL = /fetch\((?!\s*['"`])/;

function fetchsDelCodigo(): Map<string, string[]> {
  const encontrados = new Map<string, string[]>();
  for (const archivo of archivos(SRC)) {
    const texto = readFileSync(archivo, 'utf8');
    for (const m of texto.matchAll(LLAMADA_LITERAL)) {
      const url = m[1] ?? m[2] ?? m[3] ?? '';
      if (!url.startsWith('/api/') && !url.startsWith('https://api.cloudinary.com')) continue;
      const ruta = normalizar(url);
      encontrados.set(ruta, [...(encontrados.get(ruta) ?? []), path.relative(SRC, archivo)]);
    }
  }
  return encontrados;
}

const atendidas = new Set(handlers.map((h) => normalizar(String((h as HttpHandler).info.path))));

test('normalizar deja iguales la ruta del componente y la del handler', () => {
  assert.equal(normalizar('/api/cart/${productId}'), '/api/cart/:param');
  assert.equal(normalizar('*/api/cart/:productId'), '/api/cart/:param');
  assert.equal(normalizar("/api/admin/orders?status=${filtro.join(',')}"), '/api/admin/orders');
  assert.equal(
    normalizar('https://api.cloudinary.com/v1_1/${cloudName}/image/upload'),
    'https://api.cloudinary.com/v1_1/:param/image/upload'
  );
});

test('los handlers de la fase 1 atienden catalogo, carrito y contacto', () => {
  for (const ruta of ['/api/catalog', '/api/cart', '/api/cart/merge', '/api/cart/:param', '/api/send-email']) {
    assert.ok(atendidas.has(ruta), ruta);
  }
});

test('cada fetch a /api tiene handler o esta en la lista de pendientes', () => {
  const sinHandler = [...fetchsDelCodigo()]
    .filter(([ruta]) => !atendidas.has(ruta) && !(ruta in PENDIENTES))
    .map(([ruta, donde]) => `${ruta} (${donde.join(', ')})`);
  assert.deepEqual(sinHandler, [], 'fetch nuevo sin handler: agregalo en src/demo/handlers o, si es de otra fase, a PENDIENTES');
});

test('la lista de pendientes no tiene rutas que ya se atienden ni que nadie pide', () => {
  const pedidas = fetchsDelCodigo();
  const sobran = Object.keys(PENDIENTES).filter((r) => atendidas.has(r) || !pedidas.has(r));
  assert.deepEqual(sobran, []);
});

test('ningun fetch arma la URL en una variable (este test no la veria)', () => {
  const conVariable = archivos(SRC)
    .filter((a) => !a.endsWith(path.join('demo', 'msw.ts')))
    .filter((a) => LLAMADA_SIN_LITERAL.test(readFileSync(a, 'utf8')))
    .map((a) => path.relative(SRC, a));
  assert.deepEqual(conVariable, []);
});
