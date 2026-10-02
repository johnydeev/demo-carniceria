import type { MetadataRoute } from 'next';

/** La demo no se indexa: ni robots ni sitemap la anuncian. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      disallow: '/',
    },
  };
}
