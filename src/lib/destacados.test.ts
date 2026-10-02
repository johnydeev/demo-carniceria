import { test } from 'node:test';
import assert from 'node:assert/strict';
import { elegirDestacados } from './destacados.ts';

type P = { name: string; isOffer: boolean; category: string | null; imagePublicId: string | null; imageUrl: string | null };

const p = (name: string, o: Partial<P> = {}): P => ({
  name,
  isOffer: false,
  category: 'Carniceria',
  imagePublicId: 'catalogo-comun/x',
  imageUrl: null,
  ...o,
});

const nombres = (r: { seleccion: P[] }) => r.seleccion.map((x) => x.name);

const catalogo = [
  p('c1'),
  p('c2'),
  p('c3'),
  p('g1', { category: 'Granja' }),
  p('g2', { category: 'Granja' }),
  p('g3', { category: 'Granja' }),
  p('f1', { category: 'Fiambreria' }),
  p('f2', { category: 'Fiambreria' }),
  p('a1', { category: 'Almacen' }),
];

test('cupos: 2 de carniceria, 2 de granja y 1 de fiambreria', () => {
  const r = elegirDestacados(catalogo, 5);
  assert.deepEqual(nombres(r), ['c1', 'c2', 'g1', 'g2', 'f1']);
  assert.equal(r.cantidadOfertas, 0);
});

test('el cupo manda sobre la oferta: cinco ofertas de carne no llenan la fila', () => {
  const items = [
    ...['o1', 'o2', 'o3', 'o4', 'o5'].map((n) => p(n, { isOffer: true })),
    p('g1', { category: 'Granja' }),
    p('g2', { category: 'Granja' }),
    p('f1', { category: 'Fiambreria' }),
  ];
  const r = elegirDestacados(items, 5);
  assert.deepEqual(nombres(r), ['o1', 'o2', 'g1', 'g2', 'f1']);
  assert.equal(r.cantidadOfertas, 2);
});

test('dentro de cada rubro, las ofertas primero; en la fila, las ofertas adelante', () => {
  const items = [...catalogo, p('go', { category: 'Granja', isOffer: true })];
  const r = elegirDestacados(items, 5);
  assert.deepEqual(nombres(r), ['go', 'c1', 'c2', 'g1', 'f1']);
  assert.equal(r.cantidadOfertas, 1);
});

test('si un rubro no alcanza, su lugar lo ocupa otro y la fila no queda con huecos', () => {
  const items = [p('c1'), p('c2'), p('c3'), p('g1', { category: 'Granja' }), p('a1', { category: 'Almacen' })];
  const r = elegirDestacados(items, 5);
  assert.equal(r.seleccion.length, 5);
  // El relleno (c3) se muestra junto a su rubro: la fila va agrupada por rubro.
  assert.deepEqual(nombres(r), ['c1', 'c2', 'c3', 'g1', 'a1']);
});

test('el relleno prefiere ofertas y despues productos con foto', () => {
  const items = [
    p('c1'),
    p('c2'),
    p('sin', { category: 'Almacen', imagePublicId: null, imageUrl: null }),
    p('ofer', { category: 'Almacen', isOffer: true }),
    p('foto', { category: 'Almacen' }),
  ];
  const r = elegirDestacados(items, 4);
  assert.deepEqual(nombres(r), ['ofer', 'c1', 'c2', 'foto']);
});

test('dentro del cupo prefiere los que tienen foto', () => {
  const items = [
    p('sin', { imagePublicId: null }),
    p('con-url', { imagePublicId: null, imageUrl: 'https://x/y.jpg' }),
    p('con-id'),
  ];
  const r = elegirDestacados(items, 2);
  assert.deepEqual(nombres(r), ['con-url', 'con-id']);
});

test('respeta el maximo aunque los cupos sumen mas', () => {
  assert.deepEqual(nombres(elegirDestacados(catalogo, 3)), ['c1', 'c2', 'g1']);
});

test('sin productos devuelve vacio', () => {
  assert.deepEqual(elegirDestacados([], 5), { seleccion: [], cantidadOfertas: 0 });
});

test('un rubro nulo entra solo como relleno', () => {
  const r = elegirDestacados([p('n', { category: null }), p('c')], 2);
  assert.deepEqual(nombres(r), ['c', 'n']);
});
