import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { nombreRubro, PRODUCT_CATEGORIES } from '@/lib/productCategories';
import { negocio } from '@/config/negocio.config';
import ProductsPageClient from '../ProductsPageClient';
import '../productos.css';

/** El rubro viaja en minusculas en la URL y capitalizado en el store. */
const POR_SLUG: Record<string, string> = Object.fromEntries(
  PRODUCT_CATEGORIES.map((c) => [c.toLowerCase(), c])
);

/** Solo los cuatro rubros: cualquier otro slug es 404 sin llegar a la pagina. */
export const dynamicParams = false;

export function generateStaticParams() {
  return PRODUCT_CATEGORIES.map((c) => ({ rubro: c.toLowerCase() }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ rubro: string }>;
}): Promise<Metadata> {
  const { rubro } = await params;
  const categoria = POR_SLUG[rubro];

  if (!categoria) return {};

  return {
    title: `${nombreRubro(categoria)} - ${negocio.nombre}`,
    description: `Productos de ${nombreRubro(categoria)?.toLowerCase()} del catálogo de ejemplo.`,
  };
}

/** Sin JSON-LD: la demo tiene noindex. Los productos los lee ProductsPageClient. */
export default async function RubroPage({
  params,
}: {
  params: Promise<{ rubro: string }>;
}) {
  const { rubro } = await params;
  const categoria = POR_SLUG[rubro];

  if (!categoria) notFound();

  return (
    <main className="productos-page">
      <header className="productos-header">
        <div className="productos-header-content">
          <h1 className="productos-title">{nombreRubro(categoria)}</h1>
          <p className="productos-subtitle">
            Nuestros productos de {nombreRubro(categoria)?.toLowerCase()}
          </p>
        </div>
      </header>
      <ProductsPageClient categoria={categoria} />
    </main>
  );
}
