# Sincronizar la demo con la app de origen

La demo es una copia de la app de origen tomada el **2026-10-01**. Cuando la app de origen cambia, se trae a mano lo que corresponda. Las tablas dicen de dónde salió cada pieza de la demo. (Dónde está la app de origen y de qué commit se copió: en el `CLAUDE.md` local, que no se versiona.)

Repo de GitHub privado recomendado.

## Dependencias fijadas

Van sin `^` en `package.json`, para que una instalación nueva no cambie nada por su cuenta.

| Paquete | Versión instalada | Por qué fija |
|---|---|---|
| next | 16.3.8 | la misma que la app de origen |
| eslint-config-next | 16.3.8 | a la par de `next` |
| msw | 2.15.0 | `src/demo/msw.ts` usa su API (`setupWorker`, `http`, `HttpResponse`, `getResponse`); al cambiarla, regenerar `public/mockServiceWorker.js` con `npx msw init public` |
| sharp | 0.34.5 | solo devDependency, para `scripts/imagenes-demo.mjs` |

Next se subió a 16.3.8 el 2026-10-02 por vulnerabilidades críticas de 16.1.6, a la par en la app de origen. `npm audit` solo marca `sharp` (devDependency, no llega al deploy).

## Copiado sin cambios

Todo `src/` de la app de origen salvo lo que listan las secciones de abajo. En particular `src/lib/**` (lógica pura con tests), los componentes de catálogo, carrito, modal, legales, pedidos y panel.

## Portado (la regla es de la app de origen; Prisma → store)

| Demo | Origen en la app de origen |
|---|---|
| `src/demo/servicios/catalogo.ts` | `src/services/catalog.service.ts` → `getCatalog()` (qué se publica: activo y precio > 0) |
| `src/demo/servicios/carrito.ts` | `src/services/cart.service.ts` (todo); además no escribe si nada cambia (`sinCambios` de `modificar`) |
| `src/demo/servicios/carteles.ts` | `src/services/banners.service.ts` → `getBannersVigentes()` |
| `src/demo/servicios/horario.ts` | `src/services/horario.service.ts` → `obtenerHorario()` |
| `src/demo/handlers/catalogo.ts` | `src/app/api/catalog/route.ts` |
| `src/demo/handlers/carrito.ts` | `src/app/api/cart/route.ts`, `cart/merge/route.ts`, `cart/[productId]/route.ts` |
| `src/demo/handlers/contacto.ts` | `src/app/api/send-email/route.ts` (sin correo ni límite por IP) |
| `src/demo/tipos.ts` (primera parte) | `PedidoVista`, `EventoVista` (orders.service), `CobroVista` (cobro.service), `Perfil` (cuenta.service), `FirmaSubida` (archivosPedido.service), `AdminVista` (admins.service) |
| `src/demo/sesion.tsx` | API de `next-auth/react` usada por la app; forma de `session.user` de `src/types/next-auth.d.ts` |
| `src/components/admin/AdminSessionGuard.tsx` | más lo que hacía `src/proxy.ts` para `/admin` |

`src/demo/store.ts` no tiene origen: la vigencia de la semilla es por día argentino (UTC−3 fijo), el estado se regenera si le falta alguna lista y, si `localStorage` se llena, la demo sigue en memoria.

## Modificado respecto de la app de origen

| Archivo | Cambio |
|---|---|
| `package.json`, `next.config.ts`, `.gitignore` | sin Prisma, NextAuth, Cloudinary, Google, nodemailer, `postinstall` ni `remotePatterns`; con msw y sharp; versiones fijadas; dev en 8010 |
| `eslint.config.mjs` | ignora `public/mockServiceWorker.js`; excepción temporal (ver abajo) |
| `src/app/layout.tsx` | sin JSON-LD, sin `revalidate`, `noindex`; monta `DemoArranque`, `DemoBar`, `WhatsAppProvider` |
| `src/app/page.tsx`, `Hero.tsx`, `ContactForm.tsx`, `Footer.tsx` | leen el store con hooks (cliente); sin mapa; WhatsApp por modal |
| `src/app/productos/**` | páginas de servidor finas; `ProductsPageClient` lee el store; sin JSON-LD ni `revalidate` |
| `src/app/terminos/**`, `src/app/privacidad/page.tsx` | términos con el horario del store; textos legales de la demo |
| `src/app/auth/login/page.tsx` | "Entrar como cliente / dueño" (sin Google) |
| `src/app/admin/layout.tsx` | el guard envuelve el panel |
| `src/app/admin/*/page.tsx`, `src/app/pedido/page.tsx`, `src/app/cuenta/**/page.tsx` | placeholder (fases 2 y 3); las páginas de cliente del panel están en `PaginaPanel.tsx`. `/cuenta/pedidos/[number]` sale como ruta dinámica en el build hasta la fase 2 |
| `NavbarTw`, `AdminNav`, `CartProvider`, `providers/SessionProvider` | import de sesión de `@/demo/sesion`; logo y nombre de la demo; navbar debajo de la barra |
| `HeroCarousel.tsx`, `WhatsAppWidget.tsx` | WhatsApp por modal; logo nuevo |
| `ProductImage.tsx` | sin Cloudinary ni Drive: `fuenteDeImagen` de `src/demo/imagenLocal.ts` |
| `src/lib/bannerImage.ts` | rutas locales y `data:` pasan tal cual; sin cloud name escrito |
| `src/config/*`, `src/types/negocio.ts`, `opengraph-image.tsx`, `robots.ts`, `AboutMe`, `Reviews` | marca de la demo; sin `googleMaps`; robots `disallow: /`; sin sitemap |
| `src/lib/orders/aviso.ts` (comentario), `aviso.test.ts`, `mensaje.test.ts`, `cobro.test.ts`, `banners.test.ts` | datos de ejemplo (alias, dirección, WhatsApp, dominio) en lugar de los de la app de origen |
| `Reviews`, `AboutMe`, `Footer` (`SERVICIOS`), `src/app/productos/page.tsx` (subtítulo) | textos propios de la demo |
| `src/app/admin/admin.css`, `Hero.css` | descuentan el alto de la barra de la demo (`--demo-barra`) |

### Excepción de lint (temporal)

`eslint.config.mjs` apaga `react-hooks/set-state-in-effect` y `react-hooks/purity` solo en `src/app/admin/**/PaginaPanel.tsx`. Esos archivos son copia literal de la app de origen, que lintea limpia con `eslint-plugin-react-hooks` 7.0.1; la demo instaló la 7.1.1, más estricta. Se saca en la fase 3, cuando el panel se reescribe. Al traer un `PaginaPanel.tsx` nuevo de la app de origen la excepción lo sigue cubriendo.

## Borrado

`src/app/api/`, `src/services/`, `src/proxy.ts`, `src/lib/{prisma,auth,cloudinary,environment,imageProxy,limite,cacheEstado,seo}.ts` y sus tests, `src/config/nodemailer.config.ts`, `src/types/next-auth.d.ts`, `src/app/sitemap.ts`.

## Constantes internas que se dejaron

`CARPETA_PEDIDOS` (`src/lib/orders/archivos.ts`), la carpeta de carteles (`src/lib/firmaEsquema.ts`) y las claves de `localStorage` del carrito y de las métricas (`CLAVES_APP` en `src/demo/store.ts`). No se ven en pantalla y sus tests las fijan. Lista exacta en `src/demo/marca.test.ts` (`PERMITIDOS`).

## Cómo traer un cambio de la app de origen

1. En la app de origen: `git log --stat <commit de origen>..HEAD` (el commit está en el `CLAUDE.md` local) para ver qué archivos cambiaron.
2. Si el archivo está en "Copiado sin cambios": copiarlo y correr `npm test` y `npm run build`. `marca.test.ts` avisa si trajo un resto de la marca de origen.
3. Si está en "Portado" o "Modificado": aplicar a mano el cambio de la regla, no copiar el archivo.
4. Si agrega un `fetch('/api/…')`: `fetchs.test.ts` falla hasta que haya handler o se liste como pendiente.
5. Si la app de origen cambió de versión de `next`: decidir si se sube acá también (tabla de dependencias).
6. Actualizar el commit de origen en el `CLAUDE.md` local.
