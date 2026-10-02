/**
 * Elige que filas de la hoja hay que borrar, y en que orden.
 *
 * Funcion pura y separada del acceso a Google a proposito: es la pieza donde un
 * error destruye datos del duenio, y es la unica que se puede probar sin red.
 */

// Misma normalizacion que el cruce: Sheets come los ceros a la izquierda.
import { normalizarCodigo } from './merge.ts';

/**
 * Ubica la fila de un codigo para una escritura puntual (precio o codigo).
 *
 * Devuelve la posicion dentro de `codigosDeLaHoja` (sin el encabezado),
 * 'sin_fila' si no esta, o 'repetido' si esta en mas de una fila: el cruce se
 * queda con la ultima y escribir en la primera perdia el cambio sin aviso.
 */
export function ubicarFila(
  codigosDeLaHoja: string[],
  codigo: string
): number | 'sin_fila' | 'repetido' {
  const buscado = normalizarCodigo(codigo);
  let posicion = -1;

  for (let i = 0; i < codigosDeLaHoja.length; i++) {
    if (normalizarCodigo(codigosDeLaHoja[i]) !== buscado) continue;
    if (posicion !== -1) return 'repetido';
    posicion = i;
  }

  return posicion === -1 ? 'sin_fila' : posicion;
}

export interface FilaABorrar {
  /** Indice dentro de la hoja, contando el encabezado como fila 0. */
  indice: number;
  codigo: string;
}

export interface PlanDeBorrado {
  /** Filas a borrar, **de mayor a menor indice**: borrar de arriba correria las de abajo. */
  filas: FilaABorrar[];
  /** Codigos pedidos que no estaban en la hoja. No es un error. */
  noEncontrados: string[];
}

/**
 * Arma el plan de borrado a partir de los codigos de la hoja y los pedidos.
 *
 * @param codigosDeLaHoja Columna de codigos tal como se leyo, **sin el encabezado**.
 * @param codigosABorrar  Codigos de los productos que se estan borrando.
 */
export function planificarBorrado(
  codigosDeLaHoja: string[],
  codigosABorrar: string[]
): PlanDeBorrado {
  const buscados = new Set(codigosABorrar.map(normalizarCodigo));
  const encontrados = new Set<string>();
  const filas: FilaABorrar[] = [];

  codigosDeLaHoja.forEach((codigo, i) => {
    const normalizado = normalizarCodigo(codigo);
    if (!buscados.has(normalizado)) return;

    encontrados.add(normalizado);
    // +1 porque el encabezado ocupa la fila 0 de la hoja.
    filas.push({ indice: i + 1, codigo });
  });

  // De mayor a menor: borrar la fila 3 antes que la 10 correria el indice de la 10.
  filas.sort((a, b) => b.indice - a.indice);

  const noEncontrados = codigosABorrar.filter(
    (c) => !encontrados.has(normalizarCodigo(c))
  );

  return { filas, noEncontrados };
}

/**
 * Candado 2 del borrado: la columna de codigos **releida justo antes de
 * borrar** tiene que tener, en cada indice planificado, el mismo codigo que se
 * planifico. Devuelve la primera fila que no coincide, o null si todas.
 *
 * Antes se comparaba la lectura consigo misma y nunca podia fallar: si el dueno
 * insertaba o borraba filas entre la lectura y el borrado, se borraban filas
 * equivocadas.
 */
export function primeraFilaCambiada(columnaActual: string[], plan: PlanDeBorrado): FilaABorrar | null {
  for (const fila of plan.filas) {
    if ((columnaActual[fila.indice - 1] ?? '') !== fila.codigo) return fila;
  }
  return null;
}
