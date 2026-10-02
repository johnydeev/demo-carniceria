import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildCloudinaryDeliveryUrl, buildCloudinaryTransform } from './productImageProcessor.ts';

// Fija la cadena de transformacion de todo el catalogo. Cambiarla regenera las
// derivadas de todas las fotos y gasta creditos de Cloudinary (#015): si este
// test falla, el cambio tiene que ser deliberado.
test('la cadena de las cards no cambia sin querer', () => {
  assert.equal(buildCloudinaryTransform(720, 540), 'f_auto,q_auto,c_pad,b_auto,w_720,h_540');
});

test('buildCloudinaryDeliveryUrl arma la URL con la transformacion', () => {
  assert.equal(
    buildCloudinaryDeliveryUrl('catalogo-comun/vacio', 'demo', 720, 540),
    'https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,c_pad,b_auto,w_720,h_540/catalogo-comun/vacio'
  );
});
