/**
 * Lectura del store para las paginas que en la app real leen en el servidor.
 * Corre todo en el navegador y sin fetch: no hace falta inventar rutas que la
 * app real no tiene. En el servidor (prerender) devuelven null: los componentes
 * dibujan su estado de carga y se completan al hidratar.
 */
import { useMemo, useSyncExternalStore } from 'react';
import { leer, suscribir } from './store';
import { catalogoPublicable } from './servicios/catalogo';
import { cartelesVigentes, type CartelVigente } from './servicios/carteles';
import { horarioDe } from './servicios/horario';
import type { CatalogItem } from '@/lib/catalog/types';
import type { HorarioConfig } from '@/lib/horario/esquema';
import type { EstadoDemo } from './tipos';

// El snapshot es el estado crudo, que `leer()` devuelve estable (cacheado por
// el texto guardado). Lo derivado (catalogo, carteles, horario) arma objetos
// nuevos en cada llamada: va en `useMemo`, nunca como snapshot, o React entra
// en bucle ("The result of getSnapshot should be cached").
const leerAhora = () => leer();
const sinEstadoEnElServidor = () => null;

export function useEstadoDemo(): EstadoDemo | null {
  return useSyncExternalStore<EstadoDemo | null>(suscribir, leerAhora, sinEstadoEnElServidor);
}

/** El catalogo publicado, como `getCatalog({ category })`. */
export function useCatalogo(categoria?: string): CatalogItem[] | null {
  const estado = useEstadoDemo();
  return useMemo(
    () => (estado ? catalogoPublicable(estado.productos, { category: categoria }) : null),
    [estado, categoria]
  );
}

/** Los carteles vigentes, como `getBannersVigentes()`. */
export function useBannersVigentes(): CartelVigente[] | null {
  const estado = useEstadoDemo();
  return useMemo(() => (estado ? cartelesVigentes(estado.banners) : null), [estado]);
}

/** El horario para mostrar, como `obtenerHorario()`. */
export function useHorario(): HorarioConfig | null {
  const estado = useEstadoDemo();
  return useMemo(() => (estado ? horarioDe(estado) : null), [estado]);
}
