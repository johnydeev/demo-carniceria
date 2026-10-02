'use client';

import { SessionProvider } from '@/demo/sesion';

/** En la demo, la sesion es el rol elegido en la barra (src/demo/sesion.tsx). */
export default function AppSessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SessionProvider>{children}</SessionProvider>;
}
