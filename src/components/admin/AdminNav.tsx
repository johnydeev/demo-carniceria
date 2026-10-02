'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from '@/demo/sesion';
import { negocio } from '@/config/negocio.config';
import { Menu, X } from 'lucide-react';

/**
 * Evento que dispara la pagina de pedidos al cambiar un estado. El contador
 * solo se recargaba al navegar: confirmar o cancelar no lo bajaba.
 */
export const PEDIDOS_CAMBIARON = 'admin:pedidos-cambiaron';

const SECCIONES = [
  { href: '/admin', label: 'Inicio' },
  { href: '/admin/products', label: 'Productos' },
  { href: '/admin/pedidos', label: 'Pedidos' },
  { href: '/admin/horario', label: 'Horario' },
  { href: '/admin/cobro', label: 'Cobro' },
  { href: '/admin/users', label: 'Usuarios' },
  { href: '/admin/banners', label: 'Carteles' },
];

/**
 * Barra lateral del panel: secciones con el activo marcado, contador de
 * pedidos pendientes y cierre de sesion. En pantallas chicas es una barra
 * superior con hamburguesa.
 */
export default function AdminNav() {
  const pathname = usePathname();
  const [pendientes, setPendientes] = useState<number | null>(null);
  const [abierto, setAbierto] = useState(false);
  // `signOut` es asincrono y tarda en navegar: sin esto el boton quedaba quieto
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

  useEffect(() => {
    let vivo = true;
    const contar = () =>
      fetch('/api/admin/orders?contar=1')
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (vivo && d) setPendientes(d.pendientes);
        })
        .catch(() => {});
    contar();
    window.addEventListener(PEDIDOS_CAMBIARON, contar);
    return () => {
      vivo = false;
      window.removeEventListener(PEDIDOS_CAMBIARON, contar);
    };
  }, [pathname]);

  // "/admin" es prefijo de todo el panel: su activo es por igualdad exacta.
  const activo = (href: string) =>
    href === '/admin' ? pathname === '/admin' : pathname === href || pathname.startsWith(href + '/');

  return (
    <aside className={`admin-sidebar ${abierto ? 'abierto' : ''}`}>
      <div className="admin-sidebar-cabecera">
        <Link href="/admin" className="admin-brand">
          {negocio.nombre}
          <small>Panel</small>
        </Link>
        <button
          type="button"
          className="admin-sidebar-toggle"
          onClick={() => setAbierto((v) => !v)}
          aria-label={abierto ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={abierto}
        >
          {abierto ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      <nav className="admin-sidebar-nav">
        {SECCIONES.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className={`admin-link ${activo(s.href) ? 'activo' : ''}`}
            aria-current={activo(s.href) ? 'page' : undefined}
            onClick={() => setAbierto(false)}
          >
            {s.label}
            {s.href === '/admin/pedidos' && pendientes ? (
              <span className="admin-nav-contador">{pendientes}</span>
            ) : null}
          </Link>
        ))}
      </nav>

      <div className="admin-sidebar-pie">
        <Link href="/" className="admin-link" onClick={() => setAbierto(false)}>
          Ver el sitio
        </Link>
        <button type="button" className="admin-logout" onClick={salir} disabled={saliendo}>
          {saliendo ? (
            <>
              <span className="admin-spinner" aria-hidden="true" />
              Saliendo…
            </>
          ) : (
            'Cerrar sesión'
          )}
        </button>
      </div>
    </aside>
  );
}
