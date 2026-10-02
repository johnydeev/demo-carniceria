import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { semilla } from './semilla.ts';

const PUBLICO = path.resolve(import.meta.dirname, '..', '..', 'public');
const existe = (ruta: string) => existsSync(path.join(PUBLICO, ruta));
const e = semilla(new Date('2026-10-01T15:00:00.000Z'));

test('cada foto de la semilla existe en sus dos tamaños (correr npm run imagenes si falla)', () => {
  for (const p of e.productos) {
    assert.ok(p.imageUrl, `${p.name} sin imagen`);
    const url = p.imageUrl;
    assert.ok(existe(url), url);
    assert.ok(existe(url.replace('-720.webp', '-360.webp')), url);
  }
});

test('cada cartel de la semilla existe', () => {
  for (const b of e.banners) assert.ok(existe(b.imageUrl), b.imageUrl);
});

test('existen el logo y los iconos que usan el layout, el manifest y la OG', () => {
  for (const archivo of ['logo.png', 'favicon.png', 'apple-touch.png', 'icon-192.png', 'icon-512.png']) {
    assert.ok(existe(`/demo/marca/${archivo}`), archivo);
  }
});
