import { SeoConfig } from "@/types/seo";

/**
 * La demo no se indexa (noindex en el layout, robots con disallow). El dominio
 * solo alimenta `metadataBase`; si Vercel asigna otro, se cambia aca.
 */
export const seoConfig: SeoConfig = {
    title: "Carnicería La Esquina | Demo de tienda online",
    description:
        "Demo de la tienda online de una carnicería de barrio: catálogo con precios, carrito, pedidos por WhatsApp y panel del comercio. Datos de ejemplo.",
    domain: "https://demo-carniceria.vercel.app",
    siteName: "Carnicería La Esquina",
    locale: "es_AR",
    keywords: [],
};
