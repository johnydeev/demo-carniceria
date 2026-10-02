import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

const RAIZ = path.resolve(import.meta.dirname, '..', '..');
const CARPETAS = ['src', 'public'];
const DE_TEXTO = new Set(['.ts', '.tsx', '.css', '.json', '.svg', '.js', '.mjs', '.md', '.txt']);
const ESTE_ARCHIVO = 'marca.test.ts';
const GENERADOS = new Set([ESTE_ARCHIVO, 'mockServiceWorker.js']);

/**
 * Restos de la marca real: el grep obligatorio del spec, sin distinguir
 * mayusculas (cubre `granja.ancla.mp` y `granjaelancla.com`), mas el WhatsApp
 * y la direccion reales de la app de origen. "ancla" va como palabra suelta:
 * ProductCard.css dice "anclado" en un comentario.
 */
const MARCA_REAL = /\bancla\b|elancla|granja el|varela|1984|60007394|san mart[ií]n 3153/i;

/**
 * Constantes internas que se quedan a proposito (spec, procedimiento 5): no se
 * ven en pantalla y sus tests las fijan. Se borran del renglon antes de
 * buscar; si queda algo, es un resto de la marca.
 */
const PERMITIDOS = [
  'granja-elancla/tickets-y-comprobantes',
  'elancla/banners',
  'elancla/pedidos',
  'elancla.carrito',
  'elancla.metricas',
  "'elancla'",
  String.raw`elancla\\banners`,
];

function archivos(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const ruta = path.join(dir, e.name);
    return e.isDirectory() ? archivos(ruta) : [ruta];
  });
}

test('no quedan restos de la marca real en src/ ni public/', () => {
  const restos: string[] = [];
  for (const carpeta of CARPETAS) {
    for (const archivo of archivos(path.join(RAIZ, carpeta))) {
      // mockServiceWorker.js lo genera msw: su checksum en hexadecimal podria contener "1984" por azar.
      if (GENERADOS.has(path.basename(archivo)) || !DE_TEXTO.has(path.extname(archivo))) continue;
      readFileSync(archivo, 'utf8')
        .split('\n')
        .forEach((renglon, i) => {
          const limpio = PERMITIDOS.reduce((r, permitido) => r.split(permitido).join(''), renglon);
          if (MARCA_REAL.test(limpio)) restos.push(`${path.relative(RAIZ, archivo)}:${i + 1}: ${renglon.trim()}`);
        });
    }
  }
  assert.deepEqual(restos, []);
});

test('las constantes permitidas siguen existiendo (si no, sacarlas de la lista)', () => {
  const todo = archivos(path.join(RAIZ, 'src'))
    .filter((a) => path.basename(a) !== ESTE_ARCHIVO && DE_TEXTO.has(path.extname(a)))
    .map((a) => readFileSync(a, 'utf8'))
    .join('\n');
  for (const permitido of PERMITIDOS) assert.ok(todo.includes(permitido), permitido);
});
