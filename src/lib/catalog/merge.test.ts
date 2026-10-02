import { test } from 'node:test';
import assert from 'node:assert/strict';
import { codigosRepetidos, mergeCatalog, normalizarCodigo } from './merge.ts';
import type { ProductRecord, SheetRow } from './types';

function producto(over: Partial<ProductRecord> = {}): ProductRecord {
  return {
    id: 'id-1',
    code: '0012',
    name: 'Asado',
    price: 1000,
    imageUrl: 'https://ejemplo/asado.jpg',
    imagePublicId: null,
    category: 'Carniceria',
    stock: null,
    description: null,
    unit: 'Kg',
    quantity: 1,
    isOffer: false,
    isPublished: true,
    pesoAprox: null,
    ...over,
  };
}

test('toma el precio de la hoja', () => {
  const rows: SheetRow[] = [{ codigo: '0012', precio: '14999', activo: 'TRUE' }];
  const { items } = mergeCatalog([producto()], rows);

  assert.equal(items.length, 1);
  assert.equal(items[0].price, 14999);
  assert.equal(items[0].priceFromSheet, true);
});

test('no publica un producto sin fila y lo reporta', () => {
  const { items, diagnostics } = mergeCatalog([producto()], []);

  assert.equal(items.length, 0);
  assert.deepEqual(diagnostics.missingRows, ['0012']);
});

test('reporta una fila sin producto', () => {
  const rows: SheetRow[] = [
    { codigo: '0012', precio: '14999', activo: 'TRUE' },
    { codigo: '9999', precio: '100', activo: 'TRUE' },
  ];
  const { diagnostics } = mergeCatalog([producto()], rows);

  assert.deepEqual(diagnostics.orphanRows, ['9999']);
});

test('con precio no numerico usa el respaldo y lo reporta', () => {
  const rows: SheetRow[] = [{ codigo: '0012', precio: 'abc', activo: 'TRUE' }];
  const { items, diagnostics } = mergeCatalog([producto({ price: 1000 })], rows);

  assert.equal(items[0].price, 1000);
  assert.equal(items[0].priceFromSheet, false);
  assert.deepEqual(diagnostics.invalidPrices, ['0012']);
});

test('activo en FALSE no publica y no es un error', () => {
  const rows: SheetRow[] = [{ codigo: '0012', precio: '14999', activo: 'FALSE' }];
  const { items, diagnostics } = mergeCatalog([producto()], rows);

  assert.equal(items.length, 0);
  assert.deepEqual(diagnostics.missingRows, []);
  assert.deepEqual(diagnostics.invalidPrices, []);
});

// Google Sheets convierte "0012" en 12 al guardar. Estos dos tests son la red
// contra esa conversion, que de otro modo sacaria productos del catalogo sin
// emitir ningun error.
test('la hoja perdio los ceros a la izquierda y aun asi coincide', () => {
  const rows: SheetRow[] = [{ codigo: '12', precio: '14999', activo: 'TRUE' }];
  const { items, diagnostics } = mergeCatalog([producto({ code: '0012' })], rows);

  assert.equal(items.length, 1);
  assert.equal(items[0].price, 14999);
  assert.deepEqual(diagnostics.orphanRows, []);
});

test('la base tiene el codigo corto y la hoja con ceros', () => {
  const rows: SheetRow[] = [{ codigo: '0012', precio: '14999', activo: 'TRUE' }];
  const { items } = mergeCatalog([producto({ code: '12' })], rows);

  assert.equal(items.length, 1);
  assert.equal(items[0].price, 14999);
});

test('un codigo de barras largo se compara igual', () => {
  const rows: SheetRow[] = [
    { codigo: '7791234567890', precio: '2500', activo: 'TRUE' },
  ];
  const { items } = mergeCatalog(
    [producto({ code: '7791234567890', category: 'Almacen' })],
    rows
  );

  assert.equal(items.length, 1);
  assert.equal(items[0].price, 2500);
});

test('ignora espacios y mayusculas en el codigo', () => {
  const rows: SheetRow[] = [{ codigo: '  asado-3k  ', precio: '39000', activo: 'true' }];
  const { items } = mergeCatalog([producto({ code: 'ASADO-3K' })], rows);

  assert.equal(items.length, 1);
  assert.equal(items[0].price, 39000);
});

test('acepta precio con separador decimal de coma', () => {
  const rows: SheetRow[] = [{ codigo: '0012', precio: '14999,50', activo: 'TRUE' }];
  const { items } = mergeCatalog([producto()], rows);

  assert.equal(items[0].price, 14999.5);
});

test('acepta precio con separador de miles', () => {
  const rows: SheetRow[] = [{ codigo: '0012', precio: '14.999', activo: 'TRUE' }];
  const { items } = mergeCatalog([producto()], rows);

  assert.equal(items[0].price, 14999);
});

// Antes se publicaba como "$ 0". Ni siquiera con respaldo: el cero lo escribio el duenio.
test('un precio de cero no se publica, ni con respaldo, y se reporta', () => {
  const rows: SheetRow[] = [{ codigo: '0012', precio: '0', activo: 'TRUE' }];
  const { items, diagnostics } = mergeCatalog([producto({ price: 1000 })], rows);

  assert.equal(items.length, 0);
  assert.deepEqual(diagnostics.invalidPrices, ['0012']);
});

test('un cero con formato ("0,00") tampoco se publica', () => {
  const rows: SheetRow[] = [{ codigo: '0012', precio: '0,00', activo: 'TRUE' }];
  const { items, diagnostics } = mergeCatalog([producto({ price: 0 })], rows);

  assert.equal(items.length, 0);
  assert.deepEqual(diagnostics.invalidPrices, ['0012']);
});

test('un cero apagado no es un error', () => {
  const rows: SheetRow[] = [{ codigo: '0012', precio: '0', activo: 'FALSE' }];
  const { diagnostics } = mergeCatalog([producto()], rows);

  assert.deepEqual(diagnostics.invalidPrices, []);
});

test('reporta los codigos repetidos, comparados sin ceros a la izquierda', () => {
  const rows: SheetRow[] = [
    { codigo: '0012', precio: '100', activo: 'TRUE' },
    { codigo: '12', precio: '200', activo: 'TRUE' },
    { codigo: 'asado', precio: '1', activo: 'TRUE' },
    { codigo: ' ASADO ', precio: '2', activo: 'FALSE' },
    { codigo: '0012', precio: '300', activo: 'TRUE' },
    { codigo: '99', precio: '1', activo: 'TRUE' },
  ];
  const { diagnostics } = mergeCatalog([producto()], rows);

  assert.deepEqual(diagnostics.codigosRepetidos, ['12', 'ASADO']);
});

test('sin repetidos la lista queda vacia', () => {
  const rows: SheetRow[] = [
    { codigo: '0012', precio: '100', activo: 'TRUE' },
    { codigo: '13', precio: '200', activo: 'TRUE' },
  ];
  const { diagnostics } = mergeCatalog([producto()], rows);

  assert.deepEqual(diagnostics.codigosRepetidos, []);
});

test('codigosRepetidos ignora celdas vacias', () => {
  assert.deepEqual(codigosRepetidos(['', '  ', '5', '005']), ['5']);
});

test('normalizarCodigo: sin ceros a la izquierda y en mayusculas', () => {
  assert.equal(normalizarCodigo(' 0012 '), '12');
  assert.equal(normalizarCodigo('0000'), '0');
  assert.equal(normalizarCodigo('asado-3k'), 'ASADO-3K');
  assert.equal(normalizarCodigo('00A1'), '00A1');
});

test('un precio negativo se rechaza y usa el respaldo', () => {
  const rows: SheetRow[] = [{ codigo: '0012', precio: '-500', activo: 'TRUE' }];
  const { items, diagnostics } = mergeCatalog([producto({ price: 1000 })], rows);

  assert.equal(items[0].price, 1000);
  assert.deepEqual(diagnostics.invalidPrices, ['0012']);
});

test('activo con precio invalido y sin respaldo no se publica, pero se reporta', () => {
  const rows: SheetRow[] = [{ codigo: '0012', precio: '', activo: 'TRUE' }];
  const { items, diagnostics } = mergeCatalog([producto({ price: 0 })], rows);

  assert.equal(items.length, 0);
  assert.deepEqual(diagnostics.invalidPrices, ['0012']);
});
