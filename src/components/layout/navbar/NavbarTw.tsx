'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from '@/demo/sesion';
import { negocio } from '@/config/negocio.config';
import { Loader2, Menu, ShoppingCart, X } from 'lucide-react';
import { useCarrito } from '@/components/cart/CartProvider';
import CartDrawer from '@/components/cart/CartDrawer';
import '@/components/cart/cart.css';

const ENLACES = [
  { href: '/', label: 'Inicio' },
  { href: '/productos', label: 'Productos' },
  { href: '/#about-me', label: 'Nosotros' },
  { href: '/#reviews', label: 'Clientes' },
  { href: '/#contact-form', label: 'Contacto' },
];

/**
 * Barra sticky de ancho completo con fondo propio.
 *
 * Fondo blanco explicito: antes no tenia y heredaba el tema del sistema
 * operativo, negro en modo oscuro con la hamburguesa negra encima. Y sin la
 * pildora flotante al scrollear, que se superponia al contenido.
 */
const NavbarTw = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [conSombra, setConSombra] = useState(false);
  const pathname = usePathname();
  const { data } = useSession();
  // Cuenta desactivada con token vigente: se muestra como visitante.
  const session = data?.user?.bloqueado ? null : data;
  // Solo para mostrar el acceso: el panel lo protegen el proxy y cada ruta.
  const esAdmin = session?.user?.role === 'admin';
  const { cantidadLineas, abrir } = useCarrito();
  const [cuentaAbierta, setCuentaAbierta] = useState(false);
  // `signOut` es asincrono y tarda en navegar: sin esto "Salir" quedaba quieto
  // y se podia tocar de nuevo.
  const [saliendo, setSaliendo] = useState(false);

  const salir = async () => {
    setSaliendo(true);
    try {
      await signOut({ callbackUrl: '/' });
    } catch {
      setSaliendo(false);
    }
  };

  const inicial = (session?.user?.name || session?.user?.email || '?').charAt(0).toUpperCase();
  const cuentaRef = useRef<HTMLDivElement>(null);

  // El menu solo cerraba con mouseleave, que no existe en una tablet ni con
  // teclado. Escape y un toque afuera tambien lo cierran.
  useEffect(() => {
    if (!cuentaAbierta) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setCuentaAbierta(false);
    };
    const onAfuera = (e: PointerEvent) => {
      if (!cuentaRef.current?.contains(e.target as Node)) setCuentaAbierta(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onAfuera);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onAfuera);
    };
  }, [cuentaAbierta]);

  useEffect(() => {
    const onScroll = () => setConSombra(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Los enlaces a secciones (#about-me...) son partes de la landing y nunca se
  // marcan activos: en la home el activo es solo "Inicio". Sin esto, los cuatro
  // enlaces a secciones se subrayaban a la vez.
  const esActivo = (href: string) => {
    if (href.includes('#')) return false;
    return href === '/' ? pathname === '/' : pathname.startsWith(href);
  };

  return (
    <header
      // El filete rojo de arriba es el techo del logo: la unica firma de marca del navbar.
      className={`sticky top-[var(--demo-barra)] z-50 w-full bg-white border-t-[3px] border-t-accent border-b border-b-line transition-shadow ${
        conSombra ? 'shadow-card' : ''
      }`}
    >
      <nav className="mx-auto flex h-[clamp(60px,8vw,80px)] max-w-[1200px] items-center justify-between px-4">
        <Link href="/" className="flex shrink-0 items-center" aria-label={`${negocio.nombre}, inicio`}>
          <Image
            src="/demo/marca/logo.png"
            alt={negocio.nombre}
            width={260}
            height={80}
            priority
            className="h-[clamp(40px,6vw,52px)] w-auto"
          />
        </Link>

        <ul className="hidden items-center gap-6 text-sm font-semibold md:flex">
          {ENLACES.map((e) => (
            <li key={e.href}>
              <Link
                href={e.href}
                aria-current={esActivo(e.href) ? 'page' : undefined}
                className={`border-b-2 pb-0.5 transition-colors hover:text-brand ${
                  esActivo(e.href) ? 'border-accent text-brand' : 'border-transparent text-ink'
                }`}
              >
                {e.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-1">
          <button
            type="button"
            className="carrito-btn"
            onClick={abrir}
            aria-label={`Abrir carrito, ${cantidadLineas} productos`}
          >
            <ShoppingCart size={22} aria-hidden="true" />
            {cantidadLineas > 0 && <span className="carrito-contador">{cantidadLineas}</span>}
          </button>

          {session ? (
            <div ref={cuentaRef} className="relative hidden md:block">
              <button
                type="button"
                className="cuenta-btn"
                onClick={() => setCuentaAbierta((v) => !v)}
                aria-expanded={cuentaAbierta}
                aria-haspopup="menu"
              >
                {session.user.image ? (
                  // eslint-disable-next-line @next/next/no-img-element -- avatar externo de Google, sin optimizar
                  <img src={session.user.image} alt="" className="cuenta-avatar" referrerPolicy="no-referrer" />
                ) : (
                  <span className="cuenta-avatar" aria-hidden="true">
                    {inicial}
                  </span>
                )}
              </button>
              {cuentaAbierta && (
                <ul className="cuenta-menu" role="menu" onMouseLeave={() => setCuentaAbierta(false)}>
                  {esAdmin && (
                    <li role="none">
                      <Link role="menuitem" href="/admin" onClick={() => setCuentaAbierta(false)}>
                        Panel del comercio
                      </Link>
                    </li>
                  )}
                  <li role="none">
                    <Link role="menuitem" href="/cuenta" onClick={() => setCuentaAbierta(false)}>
                      Mi cuenta
                    </Link>
                  </li>
                  <li role="none">
                    <Link role="menuitem" href="/cuenta/pedidos" onClick={() => setCuentaAbierta(false)}>
                      Mis pedidos
                    </Link>
                  </li>
                  <li role="none">
                    <button
                      role="menuitem"
                      type="button"
                      onClick={salir}
                      disabled={saliendo}
                    >
                      {/* `.cuenta-menu button` es `display: block`: el spinner va en linea con el texto. */}
                      {saliendo && <Loader2 size={16} className="mr-2 inline animate-spin align-[-3px]" aria-hidden="true" />}
                      {saliendo ? 'Saliendo…' : 'Salir'}
                    </button>
                  </li>
                </ul>
              )}
            </div>
          ) : (
            <Link href="/auth/login" className="hidden text-sm font-semibold text-brand md:block">
              Ingresar
            </Link>
          )}

          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-ink hover:bg-brand-tint md:hidden"
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>

        {menuOpen && (
          <ul className="absolute left-0 top-full flex w-full flex-col gap-1 border-b border-line bg-white p-4 shadow-card md:hidden">
            {ENLACES.map((e) => (
              <li key={e.href}>
                <Link
                  href={e.href}
                  onClick={() => setMenuOpen(false)}
                  className={`block rounded-lg border-l-4 px-3 py-3 font-semibold ${
                    esActivo(e.href) ? 'border-accent bg-brand-tint text-brand' : 'border-transparent text-ink'
                  }`}
                >
                  {e.label}
                </Link>
              </li>
            ))}
            <li className="mt-2 border-t border-line pt-2">
              {session ? (
                <>
                  {esAdmin && (
                    <Link
                      href="/admin"
                      onClick={() => setMenuOpen(false)}
                      className="block rounded-lg px-3 py-3 font-semibold text-brand"
                    >
                      Panel del comercio
                    </Link>
                  )}
                  <Link
                    href="/cuenta"
                    onClick={() => setMenuOpen(false)}
                    className="block rounded-lg px-3 py-3 font-semibold text-ink"
                  >
                    Mi cuenta
                  </Link>
                  <Link
                    href="/cuenta/pedidos"
                    onClick={() => setMenuOpen(false)}
                    className="block rounded-lg px-3 py-3 font-semibold text-ink"
                  >
                    Mis pedidos
                  </Link>
                  <button
                    type="button"
                    onClick={salir}
                    disabled={saliendo}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-3 text-left font-semibold text-ink"
                  >
                    {saliendo && <Loader2 size={18} className="animate-spin" aria-hidden="true" />}
                    {saliendo ? 'Saliendo…' : 'Salir'}
                  </button>
                </>
              ) : (
                <Link
                  href="/auth/login"
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-lg px-3 py-3 font-semibold text-brand"
                >
                  Ingresar
                </Link>
              )}
            </li>
          </ul>
        )}
      </nav>
      <CartDrawer />
    </header>
  );
};

export default NavbarTw;
