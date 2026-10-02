/**
 * Lo que los tests de la demo necesitan del navegador: un `localStorage` en
 * memoria, y productos de ejemplo. No es parte de la app.
 */
import { escribir, soltarCache } from '../store.ts';
import { semilla } from '../semilla.ts';
import type { ProductoDemo } from '../tipos';

/** `localStorage` en memoria con la interfaz de Storage que usa la demo. */
export class AlmacenFalso {
  datos = new Map<string, string>();

  get length(): number {
    return this.datos.size;
  }

  clear(): void {
    this.datos.clear();
  }

  getItem(clave: string): string | null {
    return this.datos.has(clave) ? (this.datos.get(clave) as string) : null;
  }

  key(indice: number): string | null {
    return [...this.datos.keys()][indice] ?? null;
  }

  removeItem(clave: string): void {
    this.datos.delete(clave);
  }

  setItem(clave: string, valor: string): void {
    this.datos.set(clave, String(valor));
  }
}

/** Un `localStorage` vacio para cada test, y el store sin nada cacheado. */
export function instalarLocalStorage(): AlmacenFalso {
  const almacen = new AlmacenFalso();
  Object.defineProperty(globalThis, 'localStorage', { value: almacen, configurable: true, writable: true });
  soltarCache();
  return almacen;
}

/** Como la navegacion privada estricta: no hay `localStorage`. */
export function sinLocalStorage(): void {
  Object.defineProperty(globalThis, 'localStorage', { value: undefined, configurable: true, writable: true });
  soltarCache();
}

/** Producto por kilo, publicado, a $ 1.000. `datos` pisa lo que haga falta. */
export function producto(datos: Partial<ProductoDemo> & Pick<ProductoDemo, 'id'>): ProductoDemo {
  return {
    code: datos.id,
    name: datos.id,
    price: 1000,
    imageUrl: null,
    imagePublicId: null,
    category: 'Carniceria',
    stock: null,
    description: null,
    unit: 'Kg',
    quantity: 1,
    isOffer: false,
    isPublished: true,
    pesoAprox: null,
    priceUpdatedAt: null,
    createdAt: '2026-10-01T00:00:00.000Z',
    ...datos,
  };
}

/**
 * La semilla de hoy con estos productos. Con la fecha real y no una fija: los
 * servicios leen el store con `new Date()`, y una semilla de otro dia se
 * regeneraria y borraria los productos del test.
 */
export function conProductos(productos: ProductoDemo[]): void {
  escribir({ ...semilla(new Date()), productos });
}
