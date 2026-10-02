import { test } from 'node:test';
import assert from 'node:assert/strict';
import { esDeLaDemo } from './msw.ts';

const ORIGEN = 'https://demo.example';
const url = (u: string) => new URL(u);

test('atiende /api del propio sitio', () => {
  assert.equal(esDeLaDemo(url('https://demo.example/api/cart'), ORIGEN), true);
  assert.equal(esDeLaDemo(url('https://demo.example/api/catalog?ids=a'), ORIGEN), true);
});

test('atiende la subida a Cloudinary', () => {
  assert.equal(esDeLaDemo(url('https://api.cloudinary.com/v1_1/x/image/upload'), ORIGEN), true);
});

test('no toca lo demas', () => {
  assert.equal(esDeLaDemo(url('https://demo.example/_next/static/chunk.js'), ORIGEN), false);
  assert.equal(esDeLaDemo(url('https://demo.example/apix'), ORIGEN), false);
  assert.equal(esDeLaDemo(url('https://otro.example/api/cart'), ORIGEN), false);
  assert.equal(esDeLaDemo(url('https://fonts.googleapis.com/css2'), ORIGEN), false);
});
