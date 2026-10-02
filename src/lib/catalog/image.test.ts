import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CARPETA_COMUN, resolveImagePublicId } from './image.ts';

test('antepone la carpeta comun al nombre corto', () => {
  assert.equal(resolveImagePublicId('asado-tira'), 'catalogo-comun/asado-tira');
});

test('recorta espacios y pasa a minusculas', () => {
  assert.equal(resolveImagePublicId('  Asado-Tira  '), 'catalogo-comun/asado-tira');
});

test('descarta la extension del archivo', () => {
  assert.equal(resolveImagePublicId('asado.jpg'), 'catalogo-comun/asado');
  assert.equal(resolveImagePublicId('pollo.JPEG'), 'catalogo-comun/pollo');
  assert.equal(resolveImagePublicId('yerba.webp'), 'catalogo-comun/yerba');
});

test('una celda vacia no es una imagen', () => {
  assert.equal(resolveImagePublicId(''), undefined);
  assert.equal(resolveImagePublicId('   '), undefined);
  assert.equal(resolveImagePublicId(undefined), undefined);
});

test('la hoja no elige carpeta: una barra invalida la celda', () => {
  assert.equal(resolveImagePublicId('otra/cosa'), undefined);
  assert.equal(resolveImagePublicId('catalogo-comun/asado'), undefined);
});

test('una URL completa tampoco vale', () => {
  assert.equal(
    resolveImagePublicId('https://res.cloudinary.com/x/image/upload/asado'),
    undefined
  );
});

test('un nombre que queda vacio al sacarle la extension no vale', () => {
  assert.equal(resolveImagePublicId('.jpg'), undefined);
});

test('acepta lo mismo que nombres.ts del catalogo comun: solo kebab-case', () => {
  assert.equal(resolveImagePublicId('Asado-Tira.JPG'), 'catalogo-comun/asado-tira');
  assert.equal(resolveImagePublicId('pata-muslo-2.avif'), 'catalogo-comun/pata-muslo-2');
  assert.equal(resolveImagePublicId('asado tira'), undefined);
  assert.equal(resolveImagePublicId('..\\elancla\\banners\\x'), undefined);
  assert.equal(resolveImagePublicId('a\\b'), undefined);
  assert.equal(resolveImagePublicId('..'), undefined);
  assert.equal(resolveImagePublicId('x?y'), undefined);
  assert.equal(resolveImagePublicId('x#y'), undefined);
  assert.equal(resolveImagePublicId('--a'), undefined);
  assert.equal(resolveImagePublicId('a-'), undefined);
  assert.equal(resolveImagePublicId('a--b'), undefined);
  assert.equal(resolveImagePublicId('asado_tira'), undefined);
  assert.equal(resolveImagePublicId('ñandu'), undefined);
});

test('la barra invertida del test es una sola barra de verdad', () => {
  // En esta maquina el shell se come las barras: se verifica el caracter.
  assert.equal('a\\b'.length, 3);
  assert.equal('a\\b'.charCodeAt(1), 92);
});

test('solo saca las extensiones que el catalogo comun acepta', () => {
  // gif y svg no se pueden subir al catalogo comun: el nombre queda con punto e invalido.
  assert.equal(resolveImagePublicId('asado.gif'), undefined);
  assert.equal(resolveImagePublicId('asado.svg'), undefined);
  assert.equal(resolveImagePublicId('asado.png'), 'catalogo-comun/asado');
});

test('la carpeta comun esta exportada para que nadie la escriba a mano', () => {
  assert.equal(CARPETA_COMUN, 'catalogo-comun');
});
