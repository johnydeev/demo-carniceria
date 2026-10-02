import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validar } from './validar.ts';
import { ActualizarBannerSchema, ERROR_ENLACE, ERROR_OBLIGATORIOS, NuevoBannerSchema } from './bannerEsquema.ts';
import { ERROR_FECHAS } from './banners.ts';

const nuevo = { imagePublicId: 'elancla/banners/abc', alt: 'Asado' };

test('POST: un cartel minimo pasa, con enlace y fechas en null', () => {
  const r = validar(NuevoBannerSchema, nuevo);
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.deepEqual(r.datos, { imagePublicId: 'elancla/banners/abc', alt: 'Asado', linkUrl: null, startsAt: null, endsAt: null });
  }
});

test('POST: recorta imagen y texto alternativo', () => {
  const r = validar(NuevoBannerSchema, { imagePublicId: '  elancla/banners/abc ', alt: '  Asado  ' });
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.equal(r.datos.imagePublicId, 'elancla/banners/abc');
    assert.equal(r.datos.alt, 'Asado');
  }
});

test('POST: sin imagen, sin texto o con texto en blanco, el mensaje de obligatorios', () => {
  for (const body of [{ alt: 'Asado' }, { imagePublicId: 'elancla/banners/abc' }, { ...nuevo, alt: '   ' }, { ...nuevo, alt: 3 }, {}, null, 'x']) {
    const r = validar(NuevoBannerSchema, body);
    assert.equal(r.ok, false, JSON.stringify(body));
    if (!r.ok) assert.equal(r.error, ERROR_OBLIGATORIOS);
  }
});

test('POST: un enlace invalido corta con su mensaje, aunque falte la imagen', () => {
  for (const linkUrl of ['javascript:alert(1)', 'http://x.com', '//otro.sitio']) {
    const r = validar(NuevoBannerSchema, { ...nuevo, linkUrl });
    assert.equal(r.ok, false);
    if (!r.ok) assert.equal(r.error, ERROR_ENLACE);
  }
  const r = validar(NuevoBannerSchema, { linkUrl: 'javascript:alert(1)' });
  if (!r.ok) assert.equal(r.error, ERROR_ENLACE);
});

test('POST: enlace del sitio y fechas validas', () => {
  const r = validar(NuevoBannerSchema, { ...nuevo, linkUrl: ' /productos ', startsAt: '2026-10-01', endsAt: '2026-10-05' });
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.equal(r.datos.linkUrl, '/productos');
    assert.ok(r.datos.startsAt instanceof Date);
    assert.ok(r.datos.endsAt instanceof Date);
  }
});

test('POST: una fecha ilegible cuenta como sin fecha, como antes', () => {
  const r = validar(NuevoBannerSchema, { ...nuevo, startsAt: 'mañana', endsAt: 5 });
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.equal(r.datos.startsAt, null);
    assert.equal(r.datos.endsAt, null);
  }
});

test('POST: "Hasta" antes de "Desde" se rechaza; el mismo dia vale', () => {
  const mal = validar(NuevoBannerSchema, { ...nuevo, startsAt: '2026-10-05', endsAt: '2026-10-01' });
  assert.equal(mal.ok, false);
  if (!mal.ok) assert.equal(mal.error, ERROR_FECHAS);
  assert.equal(validar(NuevoBannerSchema, { ...nuevo, startsAt: '2026-10-05', endsAt: '2026-10-05' }).ok, true);
});

test('PUT: mover arriba o abajo', () => {
  for (const mover of ['arriba', 'abajo'] as const) {
    const r = validar(ActualizarBannerSchema, { mover });
    assert.equal(r.ok, true);
    if (r.ok) assert.deepEqual(r.datos, { mover });
  }
});

test('PUT: mover desconocido cae a actualizar campos', () => {
  const r = validar(ActualizarBannerSchema, { mover: 'costado', isActive: false });
  assert.equal(r.ok, true);
  if (r.ok) assert.deepEqual(r.datos, { cambios: { isActive: false } });
});

test('PUT: solo cambia lo que viene; isActive no booleano y alt vacio se ignoran', () => {
  const r = validar(ActualizarBannerSchema, { isActive: 'si', alt: '   ' });
  assert.equal(r.ok, true);
  if (r.ok) assert.deepEqual(r.datos, { cambios: {} });

  const r2 = validar(ActualizarBannerSchema, { isActive: true, alt: ' Pollo ' });
  if (r2.ok) assert.deepEqual(r2.datos, { cambios: { isActive: true, alt: 'Pollo' } });
});

test('PUT: linkUrl y fechas en null o vacias los borran', () => {
  const r = validar(ActualizarBannerSchema, { linkUrl: null, startsAt: '', endsAt: null });
  assert.equal(r.ok, true);
  if (r.ok) assert.deepEqual(r.datos, { cambios: { linkUrl: null, startsAt: null, endsAt: null } });
});

test('PUT: enlace invalido, el mensaje de siempre', () => {
  const r = validar(ActualizarBannerSchema, { linkUrl: 'data:text/html,x' });
  assert.equal(r.ok, false);
  if (!r.ok) assert.equal(r.error, ERROR_ENLACE);
});

test('PUT: "Hasta" antes de "Desde" se rechaza', () => {
  const r = validar(ActualizarBannerSchema, { startsAt: '2026-10-05', endsAt: '2026-10-01' });
  assert.equal(r.ok, false);
  if (!r.ok) assert.equal(r.error, ERROR_FECHAS);
});

test('PUT: un body que no es objeto no pasa', () => {
  assert.equal(validar(ActualizarBannerSchema, null).ok, false);
  assert.equal(validar(ActualizarBannerSchema, 'x').ok, false);
});
