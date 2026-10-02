'use client';

import { useCallback, useEffect, useState } from 'react';
import { BANNER_ALTO, BANNER_ANCHO, enlaceCartel, errorDeFechas, parsearFecha, validarDimensiones } from '@/lib/banners';
import { ERROR_ENLACE } from '@/lib/bannerEsquema';
import { soloFecha } from '@/lib/fechas';
import { bannerUrl } from '@/lib/bannerImage';

const CARPETA = 'elancla/banners';
const ERROR_RED = 'No se pudo conectar. Revisá la conexión y probá de nuevo.';

/**
 * Las mismas reglas que corre el servidor, en el mismo orden (enlace, despues
 * fechas), antes de subir nada: un 400 despues de subir dejaba la imagen
 * huerfana en `elancla/banners`. El servidor las vuelve a correr igual.
 */
function errorDelFormulario(linkUrl: string, startsAt: string, endsAt: string): string | null {
  if (enlaceCartel(linkUrl) === false) return ERROR_ENLACE;
  return errorDeFechas(parsearFecha(startsAt, false), parsearFecha(endsAt, true));
}

interface BannerItem {
  id: string;
  imageUrl: string;
  imagePublicId: string;
  alt: string;
  linkUrl: string | null;
  order: number;
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
}

/** Lee las medidas reales del archivo elegido, antes de subir nada. */
function medirImagen(file: File): Promise<{ ancho: number; alto: number; url: string }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve({ ancho: img.naturalWidth, alto: img.naturalHeight, url });
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('No se pudo leer la imagen.'));
    };
    img.src = url;
  });
}

async function subirACloudinary(file: File): Promise<string> {
  const sigRes = await fetch('/api/cloudinary/signature', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ folder: CARPETA }),
  });
  if (!sigRes.ok) throw new Error('No se pudo obtener la firma de Cloudinary.');

  const { signature, timestamp, apiKey, cloudName, folder } = await sigRes.json();
  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', apiKey);
  formData.append('timestamp', timestamp);
  formData.append('signature', signature);
  formData.append('folder', folder);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error('Error al subir la imagen a Cloudinary.');

  const data = await res.json();
  return data.public_id as string;
}

function fechaCorta(iso: string | null) {
  return iso ? soloFecha(iso) : '—';
}

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [cargando, setCargando] = useState(true);
  const [aviso, setAviso] = useState<string | null>(null);

  const [archivo, setArchivo] = useState<File | null>(null);
  const [previa, setPrevia] = useState<string | null>(null);
  const [errorMedidas, setErrorMedidas] = useState<string | null>(null);
  const [alt, setAlt] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [subiendo, setSubiendo] = useState(false);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [errorFormulario, setErrorFormulario] = useState<string | null>(null);

  // Si la ruta falla —la base dormida, por ejemplo— responde un error: se
  // muestra con un boton para reintentar en vez de romper la pagina.
  const [errorCarga, setErrorCarga] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setErrorCarga(null);
    try {
      const res = await fetch('/api/admin/banners');
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'No se pudieron cargar los carteles.');
      setBanners(data.banners ?? []);
    } catch (e) {
      setErrorCarga(e instanceof Error ? e.message : 'No se pudieron cargar los carteles.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const elegirArchivo = async (file: File | null) => {
    if (previa) URL.revokeObjectURL(previa);
    setArchivo(null);
    setPrevia(null);
    setErrorMedidas(null);
    if (!file) return;

    try {
      const { ancho, alto, url } = await medirImagen(file);
      const error = validarDimensiones(ancho, alto);
      if (error) {
        setErrorMedidas(error);
        URL.revokeObjectURL(url);
        return;
      }
      setArchivo(file);
      setPrevia(url);
    } catch (e) {
      setErrorMedidas(e instanceof Error ? e.message : 'No se pudo leer la imagen.');
    }
  };

  const crear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!archivo || !alt.trim()) return;

    setAviso(null);
    const errorPrevio = errorDelFormulario(linkUrl, startsAt, endsAt);
    setErrorFormulario(errorPrevio);
    if (errorPrevio) return;

    setSubiendo(true);
    try {
      const imagePublicId = await subirACloudinary(archivo);
      const res = await fetch('/api/admin/banners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imagePublicId, alt, linkUrl, startsAt, endsAt }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setAviso(data.error || 'No se pudo crear el cartel.');
        return;
      }
      setAlt('');
      setLinkUrl('');
      setStartsAt('');
      setEndsAt('');
      await elegirArchivo(null);
      setAviso('Cartel creado.');
      await cargar();
    } catch (err) {
      setAviso(err instanceof Error ? err.message : 'Error inesperado.');
    } finally {
      setSubiendo(false);
    }
  };

  const accion = async (id: string, cuerpo: object, metodo: 'PUT' | 'DELETE' = 'PUT') => {
    setOcupado(id);
    setAviso(null);
    try {
      const res = await fetch(`/api/admin/banners/${id}`, {
        method: metodo,
        headers: { 'Content-Type': 'application/json' },
        body: metodo === 'PUT' ? JSON.stringify(cuerpo) : undefined,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setAviso(data.error || 'No se pudo aplicar el cambio.');
      }
      await cargar();
    } catch {
      // Sin red `fetch` rechaza: sin este catch el boton volvia sin ningun aviso.
      setAviso(ERROR_RED);
    } finally {
      setOcupado(null);
    }
  };

  const borrar = (b: BannerItem) => {
    if (!confirm(`Borrar el cartel "${b.alt}"? Se borra también la imagen de Cloudinary.`)) return;
    accion(b.id, {}, 'DELETE');
  };

  return (
    <div className="admin-grid">
      <section className="admin-card">
        <h1 className="admin-h1">Carteles del inicio</h1>
        <p className="admin-helper">
          La imagen tiene que medir exactamente <strong>{BANNER_ANCHO}×{BANNER_ALTO} píxeles</strong>{' '}
          (relación 12:5, apaisada). Se ve entera en todas las pantallas, sin recorte: en el celular
          queda de unos 375 px de ancho, así que usá letra grande y poco texto.
        </p>

        <form onSubmit={crear} className="admin-form">
          <label className="admin-helper">
            Imagen
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="admin-input"
              onChange={(e) => elegirArchivo(e.target.files?.[0] ?? null)}
              disabled={subiendo}
            />
          </label>

          {errorMedidas && <p className="admin-error">{errorMedidas}</p>}

          {previa && (
            <div className="banner-previa">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previa} alt="Vista previa del cartel" />
            </div>
          )}

          <label className="admin-helper">
            Texto alternativo (obligatorio)
            <input className="admin-input" value={alt} onChange={(e) => setAlt(e.target.value)} placeholder="Ej: 3 kg de asado a $13.900 hasta el domingo" required />
          </label>

          <label className="admin-helper">
            Enlace al hacer clic (opcional)
            <input className="admin-input" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://..." />
          </label>

          <div className="admin-actions">
            <label className="admin-helper">
              Desde (opcional)
              <input type="date" className="admin-input" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
            </label>
            <label className="admin-helper">
              Hasta (opcional)
              <input type="date" className="admin-input" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
            </label>
          </div>

          {errorFormulario && <p className="admin-error">{errorFormulario}</p>}

          <button type="submit" className="admin-btn" disabled={!archivo || !alt.trim() || subiendo}>
            {subiendo ? (
              <>
                <span className="admin-spinner" aria-hidden="true" />
                Subiendo...
              </>
            ) : (
              'Agregar cartel'
            )}
          </button>
        </form>

        {aviso && <p className="admin-helper" role="status">{aviso}</p>}
      </section>

      <section className="admin-card">
        <h2 className="admin-h1">Carteles cargados</h2>
        {cargando ? (
          <p className="admin-muted">Cargando...</p>
        ) : errorCarga ? (
          <div>
            <p className="admin-error">{errorCarga}</p>
            {/* Mientras reintenta, `cargando` muestra "Cargando..." en lugar de este bloque. */}
            <button type="button" className="admin-btn secondary" onClick={cargar} disabled={cargando}>
              Reintentar
            </button>
          </div>
        ) : banners.length === 0 ? (
          <p className="admin-muted">
            No hay carteles. El inicio muestra el cartel de marca por defecto.
          </p>
        ) : (
          <ul className="banner-lista">
            {banners.map((b, i) => (
              <li key={b.id} className={`banner-item ${b.isActive ? '' : 'banner-inactivo'}`}>
                {/* Derivada de 640 px —la misma que usa el carrusel, no gasta una nueva—, nunca el original. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={bannerUrl(b.imagePublicId, 640)} alt={b.alt} className="banner-miniatura" width={240} height={100} />
                <div className="banner-datos">
                  <strong>{b.alt}</strong>
                  <span className="admin-muted">
                    {b.isActive ? 'Activo' : 'Inactivo'} · {fechaCorta(b.startsAt)} → {fechaCorta(b.endsAt)}
                    {b.linkUrl ? ` · ${b.linkUrl}` : ''}
                  </span>
                </div>
                <div className="admin-actions">
                  <button type="button" className="admin-btn secondary" disabled={i === 0 || ocupado === b.id} onClick={() => accion(b.id, { mover: 'arriba' })} aria-label="Subir">
                    {ocupado === b.id ? <span className="admin-spinner" aria-hidden="true" /> : '↑'}
                  </button>
                  <button type="button" className="admin-btn secondary" disabled={i === banners.length - 1 || ocupado === b.id} onClick={() => accion(b.id, { mover: 'abajo' })} aria-label="Bajar">
                    {ocupado === b.id ? <span className="admin-spinner" aria-hidden="true" /> : '↓'}
                  </button>
                  <button type="button" className="admin-btn secondary" disabled={ocupado === b.id} onClick={() => accion(b.id, { isActive: !b.isActive })}>
                    {ocupado === b.id ? <span className="admin-spinner" aria-hidden="true" /> : b.isActive ? 'Desactivar' : 'Activar'}
                  </button>
                  <button type="button" className="admin-btn danger" disabled={ocupado === b.id} onClick={() => borrar(b)}>
                    {ocupado === b.id ? <span className="admin-spinner" aria-hidden="true" /> : 'Borrar'}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
