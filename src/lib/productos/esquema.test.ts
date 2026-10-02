import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  BorradoSchema,
  ERROR_CANTIDAD,
  ERROR_CATEGORIA,
  ERROR_CODIGO_VACIO,
  ERROR_LISTA,
  ERROR_OBLIGATORIOS,
  ERROR_PESO,
  ERROR_PESO_SOLO_KILO,
  ERROR_PRECIO,
  ERROR_PRECIO_INICIAL,
  ERROR_SIN_PRODUCTOS,
  ERROR_UNIDAD,
  pesoPermitido,
  ProductoEdicionSchema,
  ProductoNuevoSchema,
} from './esquema.ts';

const errorDe = (schema: { safeParse: (d: unknown) => { success: boolean; error?: { issues: { message: string }[] } } }, dato: unknown) => {
  const r = schema.safeParse(dato);
  return r.success ? null : r.error!.issues[0].message;
};

const nuevo = (over: Record<string, unknown> = {}) => ({
  name: ' Asado ',
  code: ' asado-3k ',
  category: 'Carniceria',
  unit: 'Kg',
  quantity: 1,
  isOffer: false,
  pesoAprox: null,
  initialPrice: '',
  imageUrl: '',
  ...over,
});

test('alta: limpia y normaliza como la ruta', () => {
  const r = ProductoNuevoSchema.parse(nuevo({ stock: ' Disponible ' }));
  assert.equal(r.name, 'Asado');
  assert.equal(r.code, 'ASADO-3K');
  assert.equal(r.category, 'Carniceria');
  assert.equal(r.unit, 'Kg');
  assert.equal(r.quantity, 1);
  assert.equal(r.isOffer, false);
  assert.equal(r.pesoAprox, null);
  assert.equal(r.initialPrice, undefined);
  assert.equal(r.stock, 'Disponible');
  assert.equal(r.description, undefined);
});

test('alta: sin unidad es Unidad y sin cantidad es 1', () => {
  const r = ProductoNuevoSchema.parse({ name: 'Huevos', code: '5', category: 'Granja' });
  assert.equal(r.unit, 'Unidad');
  assert.equal(r.quantity, 1);
});

test('alta: cantidad y precio inicial pueden llegar como texto', () => {
  const r = ProductoNuevoSchema.parse(nuevo({ quantity: '3', initialPrice: '1500' }));
  assert.equal(r.quantity, 3);
  assert.equal(r.initialPrice, 1500);
});

test('alta: obligatorios', () => {
  assert.equal(errorDe(ProductoNuevoSchema, nuevo({ name: '  ' })), ERROR_OBLIGATORIOS);
  assert.equal(errorDe(ProductoNuevoSchema, nuevo({ code: undefined })), ERROR_OBLIGATORIOS);
  assert.equal(errorDe(ProductoNuevoSchema, nuevo({ category: null })), ERROR_OBLIGATORIOS);
});

test('alta: un nombre que no es texto ya no es un 500', () => {
  assert.equal(errorDe(ProductoNuevoSchema, nuevo({ name: 5 })), ERROR_OBLIGATORIOS);
  assert.equal(errorDe(ProductoNuevoSchema, null) !== null, true);
});

test('alta: unidad, categoria y cantidad', () => {
  assert.equal(errorDe(ProductoNuevoSchema, nuevo({ unit: 'Litro' })), ERROR_UNIDAD);
  assert.equal(errorDe(ProductoNuevoSchema, nuevo({ category: 'Verduleria' })), ERROR_CATEGORIA);
  assert.equal(errorDe(ProductoNuevoSchema, nuevo({ quantity: 0 })), ERROR_CANTIDAD);
  assert.equal(errorDe(ProductoNuevoSchema, nuevo({ quantity: 'abc' })), ERROR_CANTIDAD);
});

test('alta: peso solo con Kg y cantidad 1', () => {
  assert.equal(ProductoNuevoSchema.parse(nuevo({ pesoAprox: 10 })).pesoAprox, 10);
  assert.equal(errorDe(ProductoNuevoSchema, nuevo({ pesoAprox: 0 })), ERROR_PESO);
  assert.equal(errorDe(ProductoNuevoSchema, nuevo({ pesoAprox: 10, quantity: 2 })), ERROR_PESO_SOLO_KILO);
  assert.equal(errorDe(ProductoNuevoSchema, nuevo({ pesoAprox: 10, unit: 'Caja' })), ERROR_PESO_SOLO_KILO);
  // Un pack a precio cerrado va sin peso.
  assert.equal(ProductoNuevoSchema.parse(nuevo({ quantity: 2, pesoAprox: '' })).pesoAprox, null);
});

test('alta: precio inicial negativo o ilegible', () => {
  assert.equal(errorDe(ProductoNuevoSchema, nuevo({ initialPrice: -1 })), ERROR_PRECIO_INICIAL);
  assert.equal(errorDe(ProductoNuevoSchema, nuevo({ initialPrice: 'abc' })), ERROR_PRECIO_INICIAL);
  assert.equal(ProductoNuevoSchema.parse(nuevo({ initialPrice: 0 })).initialPrice, 0);
});

test('edicion: lo que no vino queda undefined', () => {
  const r = ProductoEdicionSchema.parse({});
  assert.deepEqual(r, {
    name: undefined,
    imageUrl: undefined,
    imagePublicId: undefined,
    stock: undefined,
    description: undefined,
    category: undefined,
    price: undefined,
    code: undefined,
    unit: undefined,
    quantity: undefined,
    isOffer: undefined,
    pesoAprox: undefined,
  });
});

test('edicion: precio redondeado a pesos enteros, vacio no cambia', () => {
  assert.equal(ProductoEdicionSchema.parse({ price: 1500.6 }).price, 1501);
  assert.equal(ProductoEdicionSchema.parse({ price: '' }).price, undefined);
  assert.equal(ProductoEdicionSchema.parse({ price: 0 }).price, 0);
  assert.equal(errorDe(ProductoEdicionSchema, { price: -1 }), ERROR_PRECIO);
  assert.equal(errorDe(ProductoEdicionSchema, { price: true }), ERROR_PRECIO);
});

test('edicion: codigo en mayusculas, vacio no', () => {
  assert.equal(ProductoEdicionSchema.parse({ code: ' ab12 ' }).code, 'AB12');
  assert.equal(errorDe(ProductoEdicionSchema, { code: '  ' }), ERROR_CODIGO_VACIO);
});

test('edicion: peso null o vacio lo borra; cero no', () => {
  assert.equal(ProductoEdicionSchema.parse({ pesoAprox: null }).pesoAprox, null);
  assert.equal(ProductoEdicionSchema.parse({ pesoAprox: '' }).pesoAprox, null);
  assert.equal(errorDe(ProductoEdicionSchema, { pesoAprox: 0 }), ERROR_PESO);
});

test('edicion: rubro vacio lo borra, invalido no pasa', () => {
  assert.equal(ProductoEdicionSchema.parse({ category: '' }).category, null);
  assert.equal(ProductoEdicionSchema.parse({ category: null }).category, null);
  assert.equal(ProductoEdicionSchema.parse({ category: 'Granja' }).category, 'Granja');
  assert.equal(errorDe(ProductoEdicionSchema, { category: 'Verduleria' }), ERROR_CATEGORIA);
});

test('edicion: unidad, cantidad e isOffer', () => {
  assert.equal(errorDe(ProductoEdicionSchema, { unit: 'Litro' }), ERROR_UNIDAD);
  assert.equal(errorDe(ProductoEdicionSchema, { quantity: 0 }), ERROR_CANTIDAD);
  assert.equal(ProductoEdicionSchema.parse({ isOffer: 'si' }).isOffer, undefined);
  assert.equal(ProductoEdicionSchema.parse({ isOffer: true }).isOffer, true);
});

test('edicion: un nombre que no es texto ya no es un 500', () => {
  assert.notEqual(errorDe(ProductoEdicionSchema, { name: 5 }), null);
});

test('edicion: si viene el nombre, no puede quedar vacio', () => {
  assert.equal(errorDe(ProductoEdicionSchema, { name: '' }), ERROR_OBLIGATORIOS);
  assert.equal(errorDe(ProductoEdicionSchema, { name: '   ' }), ERROR_OBLIGATORIOS);
  assert.equal(ProductoEdicionSchema.parse({ name: ' Asado ' }).name, 'Asado');
  // Ausente o null: no se toca el nombre guardado.
  assert.equal(ProductoEdicionSchema.parse({}).name, undefined);
  assert.equal(ProductoEdicionSchema.parse({ name: null }).name, undefined);
});

test('pesoPermitido', () => {
  assert.equal(pesoPermitido(null, 'Caja', 15), true);
  assert.equal(pesoPermitido(10, 'Kg', 1), true);
  assert.equal(pesoPermitido(10, 'Kg', 2), false);
  assert.equal(pesoPermitido(10, 'Unidad', 1), false);
});

test('borrado: mensajes de la ruta', () => {
  assert.deepEqual(BorradoSchema.parse({ ids: ['a', 'b'] }), { ids: ['a', 'b'] });
  assert.equal(errorDe(BorradoSchema, {}), ERROR_SIN_PRODUCTOS);
  assert.equal(errorDe(BorradoSchema, null), ERROR_SIN_PRODUCTOS);
  assert.equal(errorDe(BorradoSchema, { ids: [] }), ERROR_SIN_PRODUCTOS);
  assert.equal(errorDe(BorradoSchema, { ids: 'a' }), ERROR_SIN_PRODUCTOS);
  assert.equal(errorDe(BorradoSchema, { ids: [''] }), ERROR_LISTA);
  assert.equal(errorDe(BorradoSchema, { ids: [5] }), ERROR_LISTA);
  assert.equal(errorDe(BorradoSchema, { ids: Array.from({ length: 501 }, (_, i) => `id${i}`) }), ERROR_LISTA);
});
