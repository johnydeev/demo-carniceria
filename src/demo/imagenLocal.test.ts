import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fuenteDeImagen, normalizarRuta, srcSetLocal } from './imagenLocal.ts';

test('una foto de la demo trae su version de 360 en el srcset', () => {
  assert.deepEqual(fuenteDeImagen('/demo/productos/asado-720.webp'), {
    url: '/demo/productos/asado-720.webp',
    srcSet: '/demo/productos/asado-360.webp 360w, /demo/productos/asado-720.webp 720w',
    source: 'local-path',
  });
});

test('otra ruta local va sin srcset', () => {
  assert.equal(srcSetLocal('/demo/marca/logo.png'), undefined);
  assert.deepEqual(fuenteDeImagen('/demo/marca/logo.png'), { url: '/demo/marca/logo.png', srcSet: undefined, source: 'local-path' });
});

test('un data URL va tal cual', () => {
  const dato = 'data:image/jpeg;base64,AAAA';
  assert.deepEqual(fuenteDeImagen(dato), { url: dato, source: 'data-url' });
});

test('limpia espacios como la app real', () => {
  assert.equal(normalizarRuta('  /demo/x.webp \n'), '/demo/x.webp');
  assert.equal(fuenteDeImagen('  /demo/x.webp ').url, '/demo/x.webp');
});

test('sin imagen, public_id de Cloudinary, URL externa o protocolo relativo: marcador', () => {
  for (const valor of [undefined, null, '', 'productos/abc', 'https://res.cloudinary.com/x/image/upload/a', '//otro.sitio/x.png']) {
    assert.equal(fuenteDeImagen(valor).source, 'invalid', String(valor));
    assert.equal(fuenteDeImagen(valor).url, '', String(valor));
  }
});
