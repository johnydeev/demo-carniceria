import type {
  CatalogItem,
  CatalogDiagnostics,
  MergeResult,
  ProductRecord,
  SheetRow,
} from './types';

/**
 * Normaliza un codigo para comparar los dos lados.
 *
 * Google Sheets convierte a numero cualquier celda que lo parezca y le come los
 * ceros a la izquierda: "0012" queda guardado como 12. Sin esta normalizacion,
 * un producto con codigo 0012 en la base nunca encontraria su fila, no se
 * publicaria, y no habria ningun error visible.
 */
export function normalizarCodigo(valor: string): string {
  const limpio = valor.trim().toUpperCase();

  if (/^\d+$/.test(limpio)) {
    // Deja al menos un digito: "0000" queda en "0".
    return limpio.replace(/^0+(?=\d)/, '');
  }

  return limpio;
}

/**
 * Convierte el texto de la celda en numero.
 * Acepta separador de miles con punto y decimal con coma, que es como escribe
 * una persona en Argentina. Devuelve null si no representa un numero valido.
 */
export function parsearPrecio(valor: string): number | null {
  const limpio = valor.trim().replace(/\./g, '').replace(',', '.');

  if (limpio === '') return null;

  const n = Number(limpio);

  if (!Number.isFinite(n) || n < 0) return null;

  return n;
}

function estaActivo(valor: string): boolean {
  return valor.trim().toUpperCase() === 'TRUE';
}

/**
 * Codigos (normalizados) que aparecen en mas de una fila de la hoja, en el
 * orden en que se repiten por primera vez.
 *
 * Con un codigo repetido el cruce se queda con la ultima fila, pero la
 * escritura puntual del panel tocaria la primera: el precio editado se perdia
 * sin aviso. Por eso se reporta en el diagnostico y la escritura se niega.
 */
export function codigosRepetidos(codigos: string[]): string[] {
  const vistos = new Set<string>();
  const repetidos = new Set<string>();

  for (const codigo of codigos) {
    const normalizado = normalizarCodigo(codigo);
    if (!normalizado) continue;
    if (vistos.has(normalizado)) repetidos.add(normalizado);
    vistos.add(normalizado);
  }

  return [...repetidos];
}

/**
 * Cruza los productos de la base con las filas de la hoja de calculo.
 *
 * Solo se llama cuando la hoja respondio. Si Google falla, el servicio sirve
 * los precios guardados sin pasar por aca, para no confundir "el duenio no lo
 * cargo" con "no pudimos leer".
 */
export function mergeCatalog(
  products: ProductRecord[],
  rows: SheetRow[]
): MergeResult {
  const diagnostics: CatalogDiagnostics = {
    missingRows: [],
    orphanRows: [],
    invalidPrices: [],
    codigosRepetidos: codigosRepetidos(rows.map((r) => r.codigo)),
  };

  const porCodigo = new Map<string, SheetRow>();
  for (const row of rows) {
    porCodigo.set(normalizarCodigo(row.codigo), row);
  }

  const codigosDeProductos = new Set(
    products.map((p) => normalizarCodigo(p.code))
  );

  for (const row of rows) {
    if (!codigosDeProductos.has(normalizarCodigo(row.codigo))) {
      diagnostics.orphanRows.push(row.codigo.trim());
    }
  }

  const items: CatalogItem[] = [];

  for (const product of products) {
    const row = porCodigo.get(normalizarCodigo(product.code));

    if (!row) {
      diagnostics.missingRows.push(product.code);
      continue;
    }

    if (!estaActivo(row.activo)) continue;

    const precio = parsearPrecio(row.precio);

    if (precio === null) {
      diagnostics.invalidPrices.push(product.code);
      // Con respaldo se sirve el ultimo precio bueno; sin respaldo —un producto
      // recien creado vale 0— no se publica: se veia "$ 0" en el catalogo y
      // podia salir en la fila de ofertas.
      if (product.price > 0) items.push({ ...product, priceFromSheet: false });
      continue;
    }

    // Un cero en la hoja con activo TRUE se publicaba como "$ 0". No se
    // publica —ni con el respaldo: el cero lo escribio el duenio— y se reporta.
    if (precio <= 0) {
      diagnostics.invalidPrices.push(product.code);
      continue;
    }

    items.push({ ...product, price: precio, priceFromSheet: true });
  }

  return { items, diagnostics };
}
