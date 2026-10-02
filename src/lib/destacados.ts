/**
 * Que productos van en la fila de la banda del hero. Pura, sin Prisma.
 *
 * **Cupos por rubro** (decision del dueno): la fila muestra al menos 2 de
 * carniceria, 2 de granja y 1 de fiambreria, para que el inicio diga que el
 * comercio vende las tres cosas. Dentro de cada rubro van primero las ofertas y
 * despues los que tienen foto. El cupo manda sobre la oferta: cinco ofertas de
 * carne ya no llenan la fila entera.
 *
 * Si un rubro no tiene productos suficientes, su lugar lo ocupan otros —las
 * ofertas primero, despues con foto, uno por rubro en ronda—: la fila nunca
 * queda con huecos. Los sin foto solo si no queda otra.
 *
 * En la fila, las ofertas se muestran primero y el resto agrupado por rubro.
 */

export interface Destacable {
  isOffer: boolean;
  category: string | null;
  imagePublicId: string | null;
  imageUrl: string | null;
}

export interface Destacados<T> {
  seleccion: T[];
  /** Cuantas de la seleccion son ofertas. Con menos que el total, hay relleno. */
  cantidadOfertas: number;
}

/** Cupo minimo por rubro, en orden de prioridad si no entran todos. */
export const CUPOS_POR_RUBRO: ReadonlyArray<readonly [string, number]> = [
  ['Carniceria', 2],
  ['Granja', 2],
  ['Fiambreria', 1],
];

const tieneFoto = (p: Destacable) => Boolean(p.imagePublicId || p.imageUrl);

/** 0 oferta con foto, 1 oferta sin foto, 2 comun con foto, 3 comun sin foto. */
const prioridad = (p: Destacable) => (p.isOffer ? 0 : 2) + (tieneFoto(p) ? 0 : 1);

/** Orden estable por prioridad: respeta el orden original dentro de cada nivel. */
const porPrioridad = <T extends Destacable>(items: T[]): T[] =>
  items
    .map((item, i) => ({ item, i }))
    .sort((a, b) => prioridad(a.item) - prioridad(b.item) || a.i - b.i)
    .map((x) => x.item);

/** Reparte en ronda por rubro, respetando el orden de aparicion de cada uno. */
function enRondaPorRubro<T extends Destacable>(items: T[]): T[] {
  const grupos = new Map<string, T[]>();
  for (const item of items) {
    const clave = item.category ?? '';
    const grupo = grupos.get(clave);
    if (grupo) grupo.push(item);
    else grupos.set(clave, [item]);
  }

  const colas = [...grupos.values()];
  const resultado: T[] = [];
  let quedan = items.length;

  while (quedan > 0) {
    for (const cola of colas) {
      const siguiente = cola.shift();
      if (siguiente) {
        resultado.push(siguiente);
        quedan -= 1;
      }
    }
  }

  return resultado;
}

export function elegirDestacados<T extends Destacable>(
  items: T[],
  maximo: number,
  cupos: ReadonlyArray<readonly [string, number]> = CUPOS_POR_RUBRO
): Destacados<T> {
  const elegidos = new Set<T>();

  // 1. Cupos por rubro, en orden de prioridad.
  for (const [rubro, cupo] of cupos) {
    const delRubro = porPrioridad(items.filter((i) => i.category === rubro));
    for (const item of delRubro.slice(0, cupo)) {
      if (elegidos.size >= maximo) break;
      elegidos.add(item);
    }
  }

  // 2. Relleno: ofertas primero, despues con foto en ronda por rubro, despues sin foto.
  if (elegidos.size < maximo) {
    const resto = items.filter((i) => !elegidos.has(i));
    const relleno = [
      ...resto.filter((i) => i.isOffer),
      ...enRondaPorRubro(resto.filter((i) => !i.isOffer && tieneFoto(i))),
      ...enRondaPorRubro(resto.filter((i) => !i.isOffer && !tieneFoto(i))),
    ];
    for (const item of relleno) {
      if (elegidos.size >= maximo) break;
      elegidos.add(item);
    }
  }

  // 3. En la fila: ofertas primero, despues agrupados por rubro en el orden de los cupos.
  const ordenRubro = (p: Destacable) => {
    const i = cupos.findIndex(([r]) => r === p.category);
    return i === -1 ? cupos.length : i;
  };
  const seleccion = [...elegidos]
    .map((item, i) => ({ item, i }))
    .sort(
      (a, b) =>
        Number(b.item.isOffer) - Number(a.item.isOffer) || ordenRubro(a.item) - ordenRubro(b.item) || a.i - b.i
    )
    .map((x) => x.item);

  return { seleccion, cantidadOfertas: seleccion.filter((i) => i.isOffer).length };
}
