import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bannerSrcSet, bannerUrl } from './bannerImage.ts';

test('un cartel de /public o un data URL va tal cual y sin srcset', () => {
  assert.equal(bannerUrl('/demo/carteles/cartel-asado.webp', 640), '/demo/carteles/cartel-asado.webp');
  assert.equal(bannerUrl('data:image/jpeg;base64,AAAA', 1200), 'data:image/jpeg;base64,AAAA');
  assert.equal(bannerSrcSet('/demo/carteles/cartel-asado.webp'), undefined);
  assert.equal(bannerSrcSet('data:image/jpeg;base64,AAAA'), undefined);
});

test('un public_id sigue armando la URL de Cloudinary con sus anchos', () => {
  // endsWith y no una regex: `marca.test.ts` solo deja pasar la carpeta escrita tal cual.
  assert.ok(bannerUrl('elancla/banners/x', 960).endsWith(',w_960/elancla/banners/x'));
  assert.match(bannerSrcSet('elancla/banners/x') ?? '', /640w, .* 960w, .* 1200w$/);
});
