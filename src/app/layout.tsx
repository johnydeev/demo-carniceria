import type { Metadata } from "next";
import { Archivo_Black, Inter } from "next/font/google";
import WhatsAppGate from "@/components/features/whatsAppWidget/WhatsAppGate";
import AppSessionProvider from "@/components/providers/SessionProvider";
import CartGate from "@/components/cart/CartGate";
import NavbarGate from "@/components/layout/navbar/NavbarGate";
import DemoArranque from "@/demo/DemoArranque";
import DemoBar from "@/demo/DemoBar";
import { WhatsAppProvider } from "@/demo/WhatsAppModal";
import { seoConfig } from "@/config/seo.config";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const archivoBlack = Archivo_Black({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

/**
 * Sin `openGraph.images` ni `twitter.images`: los emite `opengraph-image.tsx`.
 * `noindex`: la demo no tiene que aparecer en buscadores. Sin JSON-LD.
 */
export const metadata: Metadata = {
  metadataBase: new URL(seoConfig.domain),
  title: seoConfig.title,
  description: seoConfig.description,
  openGraph: {
    title: seoConfig.title,
    description: seoConfig.description,
    url: seoConfig.domain,
    siteName: seoConfig.siteName,
    locale: seoConfig.locale,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: seoConfig.title,
    description: seoConfig.description,
  },
  icons: {
    icon: "/demo/marca/favicon.png",
    apple: "/demo/marca/apple-touch.png",
  },
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
  manifest: "/manifest.json",
};

/**
 * Sin `revalidate` ni lecturas: en la demo todo se lee en el navegador.
 * `DemoArranque` va primero: su modulo instala la espera de los fetch antes de
 * que hidrate el resto.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Las variables de fuente van en <html>, no en <body>: --font-sans se
    // computa en :root y ahi tiene que existir --font-inter, o queda invalida.
    <html lang="es" className={`${inter.variable} ${archivoBlack.variable}`}>
      <body suppressHydrationWarning>
        <DemoArranque />
        <AppSessionProvider>
          <WhatsAppProvider>
            <DemoBar />
            <CartGate>
              <NavbarGate />
              <WhatsAppGate />
              {children}
            </CartGate>
          </WhatsAppProvider>
        </AppSessionProvider>
      </body>
    </html>
  );
}
