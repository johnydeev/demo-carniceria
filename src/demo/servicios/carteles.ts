/**
 * Portado de `getBannersVigentes()` (src/services/banners.service.ts): los que
 * ve el visitante. La regla es `bannersVigentes` de src/lib/banners.ts; aca
 * solo se pasan las fechas guardadas como texto a Date.
 */
import { bannersVigentes } from '../../lib/banners.ts';
import type { BannerDemo } from '../tipos';

export interface CartelVigente extends Omit<BannerDemo, 'startsAt' | 'endsAt'> {
  startsAt: Date | null;
  endsAt: Date | null;
}

export function cartelesVigentes(banners: BannerDemo[], ahora: Date = new Date()): CartelVigente[] {
  return bannersVigentes(
    banners.map((b) => ({
      ...b,
      startsAt: b.startsAt ? new Date(b.startsAt) : null,
      endsAt: b.endsAt ? new Date(b.endsAt) : null,
    })),
    ahora
  );
}
