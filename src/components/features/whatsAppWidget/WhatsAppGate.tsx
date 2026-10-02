'use client';

import { usePathname } from 'next/navigation';
import WhatsAppWidget from './WhatsAppWidget';

export default function WhatsAppGate() {
  const pathname = usePathname();
  const hideOnAdmin = pathname.startsWith('/admin');

  if (hideOnAdmin) return null;

  return <WhatsAppWidget />;
}
