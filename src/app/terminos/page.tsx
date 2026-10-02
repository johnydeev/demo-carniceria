import type { Metadata } from 'next';
import Footer from '@/components/layout/footer/Footer';
import { negocio } from '@/config/negocio.config';
import TerminosVista from './TerminosVista';

const DESCRIPCION = `Condiciones de uso de la demo de ${negocio.nombre}: datos de ejemplo, pedidos que no se preparan y nada que se cobre.`;

export const metadata: Metadata = {
  title: `Términos y condiciones - ${negocio.nombre}`,
  description: DESCRIPCION,
  openGraph: {
    title: `Términos y condiciones - ${negocio.nombre}`,
    description: DESCRIPCION,
  },
};

export default function TerminosPage() {
  return (
    <>
      <TerminosVista />
      <Footer />
    </>
  );
}
