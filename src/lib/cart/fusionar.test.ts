import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fusionar } from './fusionar.ts';

const reglas: Record<string, { unit: string; isOffer: boolean; quantity: number }> = {
  asado: { unit: 'Kg', isOffer: false, quantity: 1 },
  huevos: { unit: 'Docena', isOffer: false, quantity: 1 },
};
const reglaDe = (id: string) => reglas[id];

test('suma cantidades del mismo producto y ajusta al paso', () => {
  const r = fusionar(
    [{ productId: 'asado', quantity: 1.5 }],
    [{ productId: 'asado', quantity: 1.2 }],
    reglaDe
  );
  assert.deepEqual(r, [{ productId: 'asado', quantity: 2.5 }]);
});

test('conserva los productos que solo estan de un lado, remoto primero', () => {
  const r = fusionar(
    [{ productId: 'huevos', quantity: 1 }],
    [{ productId: 'asado', quantity: 1 }],
    reglaDe
  );
  assert.deepEqual(r, [
    { productId: 'asado', quantity: 1 },
    { productId: 'huevos', quantity: 1 },
  ]);
});

test('descarta productos sin regla: ya no existen en el catalogo', () => {
  const r = fusionar([{ productId: 'fantasma', quantity: 2 }], [], reglaDe);
  assert.deepEqual(r, []);
});

test('acota al maximo', () => {
  const r = fusionar([{ productId: 'asado', quantity: 40 }], [{ productId: 'asado', quantity: 40 }], reglaDe);
  assert.equal(r[0].quantity, 50);
});

test('modo suma por defecto: igual que pasarlo explicito', () => {
  const local = [{ productId: 'asado', quantity: 1 }];
  const remoto = [{ productId: 'asado', quantity: 2 }];
  assert.deepEqual(fusionar(local, remoto, reglaDe), fusionar(local, remoto, reglaDe, 'suma'));
  assert.deepEqual(fusionar(local, remoto, reglaDe, 'suma'), [{ productId: 'asado', quantity: 3 }]);
});

test('modo maximo: toma el mayor de los dos lados, no la suma', () => {
  const r = fusionar(
    [
      { productId: 'asado', quantity: 1 },
      { productId: 'huevos', quantity: 3 },
    ],
    [
      { productId: 'asado', quantity: 2 },
      { productId: 'huevos', quantity: 1 },
    ],
    reglaDe,
    'maximo'
  );
  assert.deepEqual(r, [
    { productId: 'asado', quantity: 2 },
    { productId: 'huevos', quantity: 3 },
  ]);
});

test('modo maximo: conserva lo que esta de un solo lado', () => {
  const r = fusionar([{ productId: 'huevos', quantity: 2 }], [{ productId: 'asado', quantity: 1 }], reglaDe, 'maximo');
  assert.deepEqual(r, [
    { productId: 'asado', quantity: 1 },
    { productId: 'huevos', quantity: 2 },
  ]);
});

test('reintento con maximo despues de una suma que se aplico no duplica', () => {
  const local = [{ productId: 'asado', quantity: 1.5 }];
  const remoto = [{ productId: 'asado', quantity: 2 }];
  // La primera fusion se aplico en la base, pero la respuesta se perdio.
  const aplicada = fusionar(local, remoto, reglaDe, 'suma');
  const reintento = fusionar(local, aplicada, reglaDe, 'maximo');
  assert.deepEqual(reintento, aplicada);
  assert.deepEqual(reintento, [{ productId: 'asado', quantity: 3.5 }]);
});

test('maximo es idempotente: aplicarlo dos veces da lo mismo', () => {
  const local = [
    { productId: 'asado', quantity: 1.3 },
    { productId: 'huevos', quantity: 40 },
  ];
  const remoto = [
    { productId: 'asado', quantity: 1 },
    { productId: 'huevos', quantity: 60 },
  ];
  const una = fusionar(local, remoto, reglaDe, 'maximo');
  const dos = fusionar(local, una, reglaDe, 'maximo');
  assert.deepEqual(dos, una);
});

test('no mete productos sin disponible (publicado sin precio), en ningun modo', () => {
  const conAgotado = (id: string) =>
    id === 'sinprecio' ? { unit: 'Unidad', isOffer: false, quantity: 1, disponible: false } : reglaDe(id);
  for (const modo of ['suma', 'maximo'] as const) {
    const r = fusionar(
      [
        { productId: 'sinprecio', quantity: 2 },
        { productId: 'asado', quantity: 1 },
      ],
      [],
      conAgotado,
      modo
    );
    assert.deepEqual(r, [{ productId: 'asado', quantity: 1 }]);
  }
});
