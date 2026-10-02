'use client';

import { usePathname } from 'next/navigation';
import CartProvider from './CartProvider';

/** El panel no tiene carrito: adentro de /admin los hijos van sin provider. */
export default function CartGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname.startsWith('/admin')) return <>{children}</>;
  return <CartProvider>{children}</CartProvider>;
}
