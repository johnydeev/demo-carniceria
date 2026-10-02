/** Pedidos del panel agrupados por turno. Pura, con tests. El orden dentro de cada grupo es el que llego (mas nuevo primero). */
import type { EstadoPedido } from '../orders/estados';

interface ConTurno {
  status: EstadoPedido;
  turnoInicio?: string | null;
  turnoFin?: string | null;
}

export interface GrupoTurno<P> {
  clave: string;
  inicio: string | null;
  fin: string | null;
  pedidos: P[];
  /** El turno ya termino y quedan pedidos sin entregar ni cancelar. */
  atrasado: boolean;
}

const SIN_TURNO = 'sin-turno';

export function agruparPorTurno<P extends ConTurno>(pedidos: P[], ahora: Date): GrupoTurno<P>[] {
  const porClave = new Map<string, GrupoTurno<P>>();
  for (const p of pedidos) {
    const clave = p.turnoInicio ?? SIN_TURNO;
    let g = porClave.get(clave);
    if (!g) {
      g = { clave, inicio: p.turnoInicio ?? null, fin: p.turnoFin ?? null, pedidos: [], atrasado: false };
      porClave.set(clave, g);
    }
    g.pedidos.push(p);
  }
  const grupos = [...porClave.values()];
  for (const g of grupos) {
    g.atrasado =
      g.fin !== null &&
      new Date(g.fin).getTime() < ahora.getTime() &&
      g.pedidos.some((p) => p.status !== 'entregado' && p.status !== 'cancelado');
  }
  // Orden de trabajo: 0 atrasados (el mas viejo primero), 1 en curso o por
  // venir (el mas cercano primero), 2 pasados ya resueltos (el mas reciente
  // primero), 3 sin turno. Con el filtro "todos", ordenar solo por fecha
  // dejaba los de hoy enterrados debajo de dias ya entregados.
  const tramo = (g: GrupoTurno<P>) =>
    g.inicio === null ? 3 : g.atrasado ? 0 : new Date(g.fin!).getTime() >= ahora.getTime() ? 1 : 2;
  const inicio = (g: GrupoTurno<P>) => (g.inicio ? new Date(g.inicio).getTime() : 0);
  return grupos.sort((a, b) => {
    const t = tramo(a) - tramo(b);
    if (t !== 0) return t;
    return tramo(a) === 2 ? inicio(b) - inicio(a) : inicio(a) - inicio(b);
  });
}
