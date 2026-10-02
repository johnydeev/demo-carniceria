import type { Metadata } from 'next';
import LegalPage from '@/components/legal/LegalPage';
import Footer from '@/components/layout/footer/Footer';
import { politicaPrivacidad } from '@/config/legal.config';
import { negocio } from '@/config/negocio.config';

const DESCRIPCION = `Qué guarda la demo de ${negocio.nombre}: todo queda en tu navegador y nada se envía.`;

export const metadata: Metadata = {
  title: `Política de privacidad - ${negocio.nombre}`,
  description: DESCRIPCION,
  openGraph: {
    title: `Política de privacidad - ${negocio.nombre}`,
    description: DESCRIPCION,
  },
};

export default function PrivacidadPage() {
  return (
    <>
      <LegalPage doc={politicaPrivacidad} />
      <Footer />
    </>
  );
}
