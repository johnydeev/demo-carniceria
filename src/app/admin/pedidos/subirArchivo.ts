import type { FirmaSubida } from '@/demo/tipos';
import { CARPETA_PEDIDOS, type TipoArchivo } from '@/lib/orders/archivos';

/**
 * Sube un ticket o un comprobante desde el navegador, directo a Cloudinary
 * con una firma del servidor. La firma trae `type: 'authenticated'` y los
 * formatos permitidos, y van tal cual en el FormData: estan firmados, y sin
 * ellos Cloudinary rechaza la subida. Es la contraparte de
 * archivosPedido.service.ts: si cambia el proveedor, cambian los dos.
 * Devuelve el public_id; el servidor lo verifica al aplicar la accion.
 */
export async function subirArchivoPedido(archivo: File, pedido: number, tipo: TipoArchivo): Promise<string> {
  // El servidor arma el nombre ("pedido-3-ticket-<fecha>") y lo firma.
  const firma = await fetch('/api/cloudinary/signature', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ folder: CARPETA_PEDIDOS, pedido, tipo }),
  });
  if (!firma.ok) throw new Error('No se pudo preparar la subida. Probá de nuevo.');
  const f: FirmaSubida = await firma.json();

  if (archivo.size > f.maxBytes) {
    throw new Error(`El archivo pasa de ${Math.round(f.maxBytes / (1024 * 1024))} MB.`);
  }

  const datos = new FormData();
  datos.append('file', archivo);
  datos.append('api_key', f.apiKey);
  datos.append('timestamp', String(f.timestamp));
  datos.append('signature', f.signature);
  datos.append('folder', f.folder);
  datos.append('public_id', f.public_id);
  datos.append('overwrite', f.overwrite);
  datos.append('type', f.type);
  datos.append('allowed_formats', f.allowed_formats);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${f.cloudName}/image/upload`, {
    method: 'POST',
    body: datos,
  });
  if (!res.ok) {
    throw new Error('No se pudo subir el archivo. Tiene que ser una foto (JPG, PNG, WEBP o HEIC) o un PDF.');
  }
  const subido: { public_id?: string; existing?: boolean } = await res.json();
  // overwrite:false: si ya habia un archivo con ese nombre (dos subidas en el
  // mismo segundo), Cloudinary no sube el nuevo y avisa `existing`. No se usa
  // el viejo en su lugar: se pide subir de nuevo.
  if (subido.existing || !subido.public_id) {
    throw new Error('No se pudo guardar el archivo. Probá de nuevo en un segundo.');
  }
  return subido.public_id;
}
