import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cartelesVigentes } from './carteles.ts';
import type { BannerDemo } from '../tipos';

const AHORA = new Date('2026-10-01T15:00:00.000Z');

function cartel(datos: Partial<BannerDemo> & Pick<BannerDemo, 'id' | 'order'>): BannerDemo {
  return {
    imagePublicId: `elancla/banners/${datos.id}`,
    imageUrl: `/demo/carteles/${datos.id}.webp`,
    alt: datos.id,
    linkUrl: null,
    isActive: true,
    startsAt: null,
    endsAt: null,
    createdAt: '2026-09-01T00:00:00.000Z',
    ...datos,
  };
}

test('activos, dentro de su rango y ordenados', () => {
  const r = cartelesVigentes(
    [
      cartel({ id: 'b', order: 1 }),
      cartel({ id: 'a', order: 0 }),
      cartel({ id: 'apagado', order: 2, isActive: false }),
      cartel({ id: 'futuro', order: 3, startsAt: '2026-10-05T03:00:00.000Z' }),
      cartel({ id: 'vencido', order: 4, endsAt: '2026-09-30T02:59:59.999Z' }),
      cartel({ id: 'hasta-hoy', order: 5, endsAt: '2026-10-02T02:59:59.999Z' }),
    ],
    AHORA
  );
  assert.deepEqual(r.map((b) => b.id), ['a', 'b', 'hasta-hoy']);
});

test('las fechas salen como Date', () => {
  const [b] = cartelesVigentes([cartel({ id: 'x', order: 0, startsAt: '2026-09-01T03:00:00.000Z' })], AHORA);
  assert.ok(b.startsAt instanceof Date);
  assert.equal(b.endsAt, null);
});
