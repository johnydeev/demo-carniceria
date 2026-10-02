/** Indice del carrusel con vuelta en los dos sentidos. Puro, con tests. */

export function siguiente(actual: number, total: number): number {
  if (total <= 0) return 0;
  return (actual + 1) % total;
}

export function anterior(actual: number, total: number): number {
  if (total <= 0) return 0;
  return (actual - 1 + total) % total;
}
