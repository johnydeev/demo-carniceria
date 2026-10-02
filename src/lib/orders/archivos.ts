/**
 * Reglas puras de los archivos de pedidos (ticket y comprobante). Con tests.
 * Deciden que se puede borrar y que se puede usar: los archivos son la prueba
 * del cobro, y un id que llega en un body es un dato del navegador, no una orden.
 */
/** Donde se suben los tickets y comprobantes nuevos (decision del dueno, 2026-09-28). */
export const CARPETA_PEDIDOS = 'granja-elancla/tickets-y-comprobantes';

const esDePedidos = (id: string) => id.startsWith(`${CARPETA_PEDIDOS}/`);

export type TipoArchivo = 'ticket' | 'comprobante';

const dos = (n: number) => String(n).padStart(2, '0');

/**
 * El nombre de un archivo nuevo, sin la carpeta: "pedido-3-ticket-20260928-195203",
 * con la fecha y hora argentinas (UTC-3 fijo) de la subida, asi corregir un
 * ticket no pisa el anterior. Sin "#": en una direccion web corta el resto.
 */
export function nombreArchivoPedido(numero: number, tipo: TipoArchivo, ahora: Date): string {
  const a = new Date(ahora.getTime() - 3 * 60 * 60 * 1000);
  const fecha = `${a.getUTCFullYear()}${dos(a.getUTCMonth() + 1)}${dos(a.getUTCDate())}`;
  const hora = `${dos(a.getUTCHours())}${dos(a.getUTCMinutes())}${dos(a.getUTCSeconds())}`;
  return `pedido-${numero}-${tipo}-${fecha}-${hora}`;
}

/**
 * Si un id recien subido es de ese pedido y de ese tipo. El nombre lo fija el
 * servidor al firmar: esto evita cargarle a un pedido el archivo subido para otro.
 */
export function esArchivoDelPedido(id: string, numero: number, tipo: TipoArchivo): boolean {
  return id.startsWith(`${CARPETA_PEDIDOS}/pedido-${numero}-${tipo}-`);
}

/** Los public_id que trae un body cualquiera (aunque no haya pasado Zod), sin repetir. */
export function idsDelBody(body: unknown): string[] {
  if (typeof body !== 'object' || body === null) return [];
  const b = body as Record<string, unknown>;
  const ids = [b.ticketPublicId, b.comprobantePublicId].filter(
    (x): x is string => typeof x === 'string' && x.trim() !== ''
  );
  return [...new Set(ids.map((x) => x.trim()))];
}

/**
 * Todos los ids que son prueba de algun cobro: el ticket y el comprobante
 * actuales de cada pedido y los tickets reemplazados por "Corregir ticket"
 * (`OrderEvento.archivoAnterior`). Un id de este conjunto no se borra ni se reusa.
 */
export function reunirEnUso(
  pedidos: { ticketPublicId: string | null; comprobantePublicId: string | null }[],
  anteriores: (string | null)[]
): Set<string> {
  return new Set(
    [...pedidos.flatMap((p) => [p.ticketPublicId, p.comprobantePublicId]), ...anteriores].filter(
      (x): x is string => x !== null
    )
  );
}

/**
 * Lo unico que se puede borrar: ids que (a) llegaron en este request, de la
 * carpeta de pedidos, (b) no son el ticket ni el comprobante actuales del
 * pedido y (c) no los referencia ningun pedido ni ningun evento (`enUso`,
 * armado con `reunirEnUso`). Todo lo demas es
 * prueba de un cobro, o de otro pedido, y no se toca.
 */
export function idsParaBorrar(
  delBody: string[],
  actualesDelPedido: (string | null)[],
  enUso: ReadonlySet<string>
): string[] {
  const actuales = new Set(actualesDelPedido.filter((x): x is string => x !== null));
  return [...new Set(delBody)].filter((id) => esDePedidos(id) && !actuales.has(id) && !enUso.has(id));
}

/**
 * Ids del body que ya usa algun pedido: se rechazan (400). Sin esto, un
 * comprobante se podia reusar para otro pedido, y el borrado de un huerfano
 * podia llevarse la prueba de otro.
 */
export function archivosReusados(delBody: string[], enUso: ReadonlySet<string>): string[] {
  return [...new Set(delBody)].filter((id) => enUso.has(id));
}

/**
 * El formato para el enlace temporal. Una foto HEIC (la del iPhone) se pide
 * como JPG: Cloudinary la convierte y el navegador la puede mostrar.
 */
export function formatoDeEntrega(formato: string): string {
  const f = formato.toLowerCase();
  return f === 'heic' || f === 'heif' ? 'jpg' : f;
}
