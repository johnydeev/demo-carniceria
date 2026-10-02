'use client';

import { usePathname } from 'next/navigation';
import NavbarTw from './NavbarTw';

export default function NavbarGate() {
  const pathname = usePathname();
  const hideOnAdmin = pathname.startsWith('/admin');

  if (hideOnAdmin) return null;

  return <NavbarTw />;
}
