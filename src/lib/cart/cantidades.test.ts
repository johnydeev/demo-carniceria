import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MAXIMO, ajustar, esPaquete, esPieza, formatearCantidad, minimo, paso, precioEfectivo, subtotal } from './cantidades.ts';

const kg = { unit: 'Kg', isOffer: false, quantity: 1 };
const unidad = { unit: 'Unidad', isOffer: false, quantity: 1 };
const docena = { unit: 'Docena', isOffer: false, quantity: 1 };
const caja = { unit: 'Caja', isOffer: false, quantity: 1 };
const promo = { unit: 'Kg', isOffer: true, quantity: 3 };
// Paquete sin marcar oferta: "Huevos x 30" con quantity 30.
const pack = { unit: 'Unidad', isOffer: false, quantity: 30 };

test('paso: 0,5 por kilo suelto, 1 para el resto y para cualquier paquete', () => {
  assert.equal(paso(kg), 0.5);
  assert.equal(paso(unidad), 1);
  assert.equal(paso(docena), 1);
  assert.equal(paso(promo), 1);
  assert.equal(paso({ unit: 'Kg', isOffer: false, quantity: 3 }), 1);
});

test('minimo es el paso', () => {
  assert.equal(minimo(kg), 0.5);
  assert.equal(minimo(promo), 1);
});

test('ajustar redondea al paso y acota entre minimo y maximo', () => {
  assert.equal(ajustar(1.3, kg), 1.5);
  assert.equal(ajustar(1.2, kg), 1);
  assert.equal(ajustar(0.1, kg), 0.5);
  assert.equal(ajustar(2.7, unidad), 3);
  assert.equal(ajustar(999, kg), MAXIMO);
  assert.equal(ajustar(0, unidad), 1);
  assert.equal(ajustar(Number.NaN, kg), 0.5);
});

test('formatearCantidad por unidad', () => {
  assert.equal(formatearCantidad(1.5, kg), '1,5 kg');
  assert.equal(formatearCantidad(2, kg), '2 kg');
  assert.equal(formatearCantidad(1, unidad), '1 u');
  assert.equal(formatearCantidad(1, docena), '1 docena');
  assert.equal(formatearCantidad(2, docena), '2 docenas');
  assert.equal(formatearCantidad(1, caja), '1 caja');
  assert.equal(formatearCantidad(3, caja), '3 cajas');
});

test('formatearCantidad de un paquete muestra los packs y lo que traen', () => {
  assert.equal(formatearCantidad(1, promo), '1 × 3 kg');
  assert.equal(formatearCantidad(2, promo), '2 × 3 kg');
  assert.equal(formatearCantidad(2, pack), '2 × 30 u');
});

test('esPaquete: solo por cantidad distinta de uno; una oferta por kilo no es paquete', () => {
  assert.equal(esPaquete(kg), false);
  assert.equal(esPaquete(promo), true);
  assert.equal(esPaquete(pack), true);
  const ofertaPorKilo = { unit: 'Kg', isOffer: true, quantity: 1 };
  assert.equal(esPaquete(ofertaPorKilo), false);
  assert.equal(paso(ofertaPorKilo), 0.5);
  assert.equal(formatearCantidad(1.5, ofertaPorKilo), '1,5 kg');
});

// "Matambre x 0,5 kg" a precio cerrado: pack, no kilo suelto.
const medioKilo = { unit: 'Kg', isOffer: false, quantity: 0.5 };

test('esPaquete: cualquier cantidad distinta de 1, tambien menor a uno', () => {
  assert.equal(esPaquete(kg), false);
  assert.equal(esPaquete(medioKilo), true);
  assert.equal(esPaquete({ unit: 'Kg', isOffer: false, quantity: 3 }), true);
  assert.equal(esPaquete({ unit: 'Kg', isOffer: true, quantity: 0.5 }), true);
});

test('esPaquete: cantidad cero, negativa o no numerica es un dato roto, no un pack', () => {
  assert.equal(esPaquete({ unit: 'Kg', isOffer: false, quantity: 0 }), false);
  assert.equal(esPaquete({ unit: 'Kg', isOffer: false, quantity: -2 }), false);
  assert.equal(esPaquete({ unit: 'Kg', isOffer: false, quantity: Number.NaN }), false);
});

test('pack de 0,5 kg: se pide de a un pack y se cobra el precio cerrado', () => {
  assert.equal(paso(medioKilo), 1);
  assert.equal(minimo(medioKilo), 1);
  assert.equal(ajustar(0.5, medioKilo), 1);
  assert.equal(ajustar(2.4, medioKilo), 2);
  assert.equal(formatearCantidad(1, medioKilo), '1 × 0,5 kg');
  assert.equal(formatearCantidad(3, medioKilo), '3 × 0,5 kg');
  // Un pack a $ 5.000 vale $ 5.000, no la mitad.
  assert.equal(precioEfectivo(5000, medioKilo), 5000);
  assert.equal(subtotal(5000, 1, medioKilo), 5000);
  assert.equal(subtotal(5000, 2, medioKilo), 10000);
});

test('subtotal en los cuatro casos: kilo suelto, pack chico, pack grande y pieza', () => {
  assert.equal(subtotal(10000, 1.5, kg), 15000);
  assert.equal(subtotal(5000, 1, medioKilo), 5000);
  assert.equal(subtotal(20999, 2, { unit: 'Kg', isOffer: false, quantity: 3 }), 41998);
  assert.equal(subtotal(13900, 1, { unit: 'Kg', isOffer: false, quantity: 1, pesoAprox: 10 }), 139000);
});

const pieza = { unit: 'Kg', isOffer: false, quantity: 1, pesoAprox: 10 };

test('pieza: se pide de a una y se formatea en piezas', () => {
  assert.equal(esPieza(pieza), true);
  assert.equal(esPieza(kg), false);
  assert.equal(esPieza({ ...kg, pesoAprox: 0 }), false);
  assert.equal(paso(pieza), 1);
  assert.equal(minimo(pieza), 1);
  assert.equal(formatearCantidad(1, pieza), '1 pieza');
  assert.equal(formatearCantidad(2, pieza), '2 piezas');
});

test('precioEfectivo: la pieza vale precio por kilo por el peso aproximado; el resto, el precio', () => {
  assert.equal(precioEfectivo(13900, pieza), 139000);
  assert.equal(precioEfectivo(13900, kg), 13900);
  assert.equal(precioEfectivo(4500, promo), 4500);
});

test('subtotal: precio efectivo por cantidad, redondeado', () => {
  assert.equal(subtotal(13900, 1.5, kg), 20850);
  assert.equal(subtotal(13900, 2, pieza), 278000);
  assert.equal(subtotal(1333, 0.5, kg), 667);
});
