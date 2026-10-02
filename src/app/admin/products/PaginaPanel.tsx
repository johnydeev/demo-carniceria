'use client';

import { useCallback, useEffect, useState } from 'react';
import AdminModal from '@/components/admin/AdminModal';
import {
  PRODUCT_CARD_IMAGE_RECOMMENDED_UPLOAD,
  PRODUCT_CARD_IMAGE_SIZE,
} from '@/lib/productImageProcessor';
import { PRODUCT_CATEGORIES, type ProductCategory } from '@/lib/productCategories';
import { fechaHoraCompleta } from '@/lib/fechas';

interface ProductItem {
  id: string;
  name: string;
  // La API serializa el Decimal de Prisma, así que por JSON llega como cadena.
  price: number | string;
  imageUrl: string;
  imagePublicId?: string | null;
  category?: ProductCategory | null;
  stock?: string | null;
  description?: string | null;
  code?: string | null;
  unit?: string;
  quantity?: number;
  isOffer?: boolean;
  pesoAprox?: number | null;
  isPublished?: boolean;
  priceUpdatedAt?: string | null;
}

interface Diagnostico {
  diagnostics: {
    missingRows: string[];
    orphanRows: string[];
    invalidPrices: string[];
    /** Codigos en mas de una fila: su precio y su codigo no se editan desde el panel. */
    codigosRepetidos?: string[];
  };
  stale: boolean;
  readAt: string | null;
  publicados: number;
  /** Solo vienen al sincronizar, no al consultar el estado. */
  creados?: string[];
  conImagen?: string[];
  rechazados?: string[];
}

async function uploadImage(file: File) {
  const sigRes = await fetch('/api/cloudinary/signature', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ folder: 'productos' }),
  });

  if (!sigRes.ok) {
    throw new Error('No se pudo obtener firma de Cloudinary.');
  }

  const { signature, timestamp, apiKey, cloudName, folder } = await sigRes.json();

  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', apiKey);
  formData.append('timestamp', timestamp);
  formData.append('signature', signature);
  formData.append('folder', folder);

  const uploadRes = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: 'POST', body: formData }
  );

  if (!uploadRes.ok) {
    throw new Error('Error al subir imagen a Cloudinary.');
  }

  const data = await uploadRes.json();
  return {
    imageUrl: data.secure_url as string,
    imagePublicId: data.public_id as string,
  };
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [imageHint, setImageHint] = useState<string | null>(null);
  const [imageHintType, setImageHintType] = useState<'info' | 'warning'>('info');
  const [editing, setEditing] = useState<ProductItem | null>(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [form, setForm] = useState({
    name: '',
    code: '',
    unit: 'Kg',
    quantity: '1',
    isOffer: false,
    pesoAprox: '',
    initialPrice: '',
    price: '',
    category: '',
    stock: '',
    description: '',
  });
  const [diag, setDiag] = useState<Diagnostico | null>(null);
  /** La ruta del diagnostico respondio con error (base dormida): se dice en vez de esconder el bloque. */
  const [errorDiag, setErrorDiag] = useState<string | null>(null);
  const [avisoHoja, setAvisoHoja] = useState<string | null>(null);
  /** Error al cargar la lista: aparte del aviso de la hoja, para que "Sincronizar" no lo tape. */
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [reintentando, setReintentando] = useState(false);
  const [refrescando, setRefrescando] = useState(false);
  const [filtro, setFiltro] = useState('');
  const [seleccion, setSeleccion] = useState<Set<string>>(new Set());
  const [borrando, setBorrando] = useState(false);
  const [borrandoId, setBorrandoId] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const cardRatio = PRODUCT_CARD_IMAGE_SIZE.width / PRODUCT_CARD_IMAGE_SIZE.height;

  const readImageSize = (file: File): Promise<{ width: number; height: number }> =>
    new Promise((resolve, reject) => {
      const objectUrl = URL.createObjectURL(file);
      const image = new Image();

      image.onload = () => {
        resolve({ width: image.naturalWidth, height: image.naturalHeight });
        URL.revokeObjectURL(objectUrl);
      };

      image.onerror = () => {
        reject(new Error('No se pudo leer la imagen seleccionada.'));
        URL.revokeObjectURL(objectUrl);
      };

      image.src = objectUrl;
    });

  const loadProducts = async () => {
    // Con la base dormida la ruta responde un error (o la red falla): se avisa
    // en vez de romper la pagina, y la lista que ya estaba no se borra.
    try {
      const res = await fetch('/api/products', { cache: 'no-store' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'No se pudieron cargar los productos.');
      setProducts(data.products || []);
      setErrorCarga(null);
    } catch (e) {
      setErrorCarga(e instanceof Error ? e.message : 'No se pudieron cargar los productos.');
    }
  };

  const loadDiagnostics = async () => {
    try {
      const res = await fetch('/api/admin/catalog-diagnostics', { cache: 'no-store' });
      const cuerpo = await res.json().catch(() => ({}));
      setDiag(res.ok ? cuerpo : null);
      setErrorDiag(res.ok ? null : cuerpo.error || 'No se pudo leer el estado de la hoja. Recargá la página.');
    } catch {
      setDiag(null);
      setErrorDiag('No se pudo leer el estado de la hoja. Recargá la página.');
    }
  };

  useEffect(() => {
    loadProducts();
    loadDiagnostics();
  }, []);

  const handleSincronizar = async () => {
    setRefrescando(true);
    setAvisoHoja(null);
    try {
      const res = await fetch('/api/admin/catalog-diagnostics', { method: 'POST' });
      const cuerpo = await res.json().catch(() => ({}));
      const data = res.ok ? cuerpo : null;
      if (!res.ok) setAvisoHoja(cuerpo.error || 'No se pudo sincronizar con la hoja. Probá de nuevo.');

      await loadProducts();

      if (data) {
        setDiag(data);
        setErrorDiag(null);

        const partes: string[] = [];
        if (data.creados?.length) {
          partes.push(`Se crearon ${data.creados.length} productos desde la hoja.`);
        }
        if (data.conImagen?.length) {
          partes.push(`Se completaron ${data.conImagen.length} fotos desde el catálogo común.`);
        }
        if (data.rechazados?.length) {
          partes.push(`No se pudieron crear: ${data.rechazados.join(' | ')}`);
        }
        setAvisoHoja(partes.length > 0 ? partes.join(' ') : 'Sincronizado. No habia productos nuevos en la hoja.');
      }
    } finally {
      setRefrescando(false);
    }
  };

  const resetForm = () => {
    setForm({
      name: '',
      code: '',
      unit: 'Kg',
      quantity: '1',
      isOffer: false,
      pesoAprox: '',
      initialPrice: '',
      price: '',
      category: '',
      stock: '',
      description: '',
    });
    setImageFile(null);
    setImageHint(null);
    setEditing(null);
    setFormError(null);
  };

  const abrirNuevo = () => {
    resetForm();
    setModalAbierto(true);
  };

  const cerrarModal = useCallback(() => {
    setModalAbierto(false);
    resetForm();
  }, []);

  const handleImageChange = async (file: File | null) => {
    setImageFile(file);

    if (!file) {
      setImageHint(null);
      setImageHintType('info');
      return;
    }

    try {
      const { width, height } = await readImageSize(file);
      const ratio = width / height;
      const ratioDelta = Math.abs(ratio - cardRatio);
      const isRatioOff = ratioDelta > 0.08;
      const isBelowCardSize =
        width < PRODUCT_CARD_IMAGE_SIZE.width || height < PRODUCT_CARD_IMAGE_SIZE.height;
      const isBelowRecommended =
        width < PRODUCT_CARD_IMAGE_RECOMMENDED_UPLOAD.width ||
        height < PRODUCT_CARD_IMAGE_RECOMMENDED_UPLOAD.height;

      if (isRatioOff) {
        // Ya no se recorta: la tarjeta rellena los costados. El aviso es
        // informativo, no una advertencia.
        setImageHintType('info');
        setImageHint(
          `La imagen es ${width}x${height}. Se va a mostrar completa, con barras a los costados. Para que llene la tarjeta sin barras, usa proporcion 4:3 (ej: ${PRODUCT_CARD_IMAGE_RECOMMENDED_UPLOAD.width}x${PRODUCT_CARD_IMAGE_RECOMMENDED_UPLOAD.height}).`
        );
        return;
      }

      if (isBelowCardSize) {
        setImageHintType('warning');
        setImageHint(
          `La imagen es ${width}x${height}. Es menor al tamano de card (${PRODUCT_CARD_IMAGE_SIZE.width}x${PRODUCT_CARD_IMAGE_SIZE.height}) y puede perder nitidez.`
        );
        return;
      }

      if (isBelowRecommended) {
        setImageHintType('info');
        setImageHint(
          `La imagen es ${width}x${height}. Funciona, pero para mejor calidad sube al menos ${PRODUCT_CARD_IMAGE_RECOMMENDED_UPLOAD.width}x${PRODUCT_CARD_IMAGE_RECOMMENDED_UPLOAD.height} en 4:3.`
        );
        return;
      }

      setImageHintType('info');
      setImageHint(`Imagen correcta (${width}x${height}) para la card.`);
    } catch (error) {
      setImageHintType('warning');
      setImageHint(error instanceof Error ? error.message : 'No se pudo validar la imagen.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setAvisoHoja(null);

    if (!form.name || !form.code || !form.category) {
      setFormError('Nombre, codigo y categoria son obligatorios.');
      return;
    }

    if (!Number(form.quantity) || Number(form.quantity) <= 0) {
      setFormError('La cantidad debe ser mayor a cero.');
      return;
    }

    const pesoAprox = form.pesoAprox === '' ? null : Number(form.pesoAprox);
    if (pesoAprox !== null && !(pesoAprox > 0)) {
      setFormError('El peso aproximado debe ser mayor a cero.');
      return;
    }
    if (pesoAprox !== null && (form.unit !== 'Kg' || Number(form.quantity) !== 1)) {
      setFormError(
        'El peso aproximado es solo para piezas con precio por kilo: unidad Kg y cantidad 1. Un pack o caja a precio cerrado va sin peso, con la cantidad de kilos que trae.'
      );
      return;
    }

    setLoading(true);

    try {
      let imageUrl = editing?.imageUrl || '';
      let imagePublicId = editing?.imagePublicId || '';

      // Sin foto se puede crear: la hoja puede nombrar una del catalogo comun al sincronizar.

      if (imageFile) {
        const upload = await uploadImage(imageFile);
        imageUrl = upload.imageUrl;
        imagePublicId = upload.imagePublicId;
      }

      const payload = {
        name: form.name,
        code: form.code,
        unit: form.unit,
        quantity: Number(form.quantity),
        isOffer: form.isOffer,
        pesoAprox,
        initialPrice: editing ? undefined : form.initialPrice,
        // Solo si cambio: asi una edicion de nombre no reescribe la hoja.
        price:
          editing && form.price !== '' && Number(form.price) !== Number(editing.price)
            ? Number(form.price)
            : undefined,
        category: form.category,
        stock: form.stock || undefined,
        description: form.description || undefined,
        imageUrl,
        imagePublicId: imagePublicId || undefined,
      };

      if (editing) {
        const res = await fetch(`/api/products/${editing.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          // Sin cuerpo (la base no respondio) no se puede parsear: mensaje legible en vez de un crash.
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || 'No se pudo guardar. Reintentá en unos segundos.');
        }

        const actualizado = await res.json().catch(() => ({}));
        // Precio y codigo pueden cambiar juntos: se juntan los dos avisos. Antes
        // el del codigo pisaba al del precio y el precio fallido pasaba inadvertido.
        const avisos: string[] = [];
        if (actualizado.sheetPrice === 'actualizada') {
          avisos.push(`Precio actualizado en la hoja y en la base: $${Math.round(Number(form.price))}.`);
        } else if (actualizado.sheetPrice === 'sin_fila') {
          avisos.push(
            `Precio guardado en la base, pero la hoja no tiene fila con el codigo ${form.code}: cargala para que se publique.`
          );
        } else if (actualizado.sheetPrice === 'fallo') {
          avisos.push('No se pudo escribir el precio en la hoja; no se cambio. Reintenta o cambialo en la hoja.');
        } else if (actualizado.sheetPrice === 'repetido') {
          // El mensaje lo arma el servidor: "El código X está repetido en la hoja: ..."
          avisos.push(`${actualizado.avisoPrecio} El precio no se cambio.`);
        }
        // Precio guardado, pero el servidor avisa algo mas (por ejemplo, un 0 no se publica).
        if (
          (actualizado.sheetPrice === 'actualizada' || actualizado.sheetPrice === 'sin_fila') &&
          actualizado.avisoPrecio
        ) {
          avisos.push(actualizado.avisoPrecio);
        }
        // Si la hoja fallo o el codigo esta repetido, el servidor responde error y
        // no guarda nada: ese caso sale por el formError de arriba.
        if (actualizado.sheetCode === 'actualizada') {
          avisos.push(`Codigo cambiado tambien en la hoja: ahora es ${form.code}.`);
        } else if (actualizado.sheetCode === 'sin_fila') {
          avisos.push(`La hoja no tenia fila con el codigo anterior. Cargala a mano con el codigo ${form.code}.`);
        }
        if (avisos.length > 0) setAvisoHoja(avisos.join(' '));
      } else {
        const res = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || 'No se pudo crear. Reintentá en unos segundos.');
        }

        const creado = await res.json().catch(() => ({}));

        if (creado.sheetRow === 'agregada') {
          setAvisoHoja(
            // El servidor solo prende la fila con un precio mayor a cero: un 0 la deja apagada.
            Number(form.initialPrice) > 0
              ? `Se agrego la fila ${form.code} a la hoja con precio ${form.initialPrice} y activa. El producto ya esta publicado.`
              : `Se agrego la fila ${form.code} a la hoja con precio 0 y apagada. Completá el precio y pone activo en TRUE para publicarlo.`
          );
        } else if (creado.sheetRow === 'ya_existia') {
          setAvisoHoja(`El codigo ${form.code} ya estaba en la hoja de calculo.`);
        } else {
          setAvisoHoja(
            `No se pudo agregar la fila ${form.code} a la hoja. Cargala a mano: codigo ${form.code}, precio 0, activo FALSE.`
          );
        }
      }

      await loadProducts();
      resetForm();
      setModalAbierto(false);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Error inesperado.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product: ProductItem) => {
    setModalAbierto(true);
    setEditing(product);
    setForm({
      name: product.name,
      code: product.code || '',
      unit: product.unit || 'Kg',
      quantity: String(product.quantity ?? 1),
      isOffer: Boolean(product.isOffer),
      pesoAprox: product.pesoAprox != null ? String(product.pesoAprox) : '',
      initialPrice: '',
      price: String(product.price ?? ''),
      category: product.category || '',
      stock: product.stock || '',
      description: product.description || '',
    });
    setImageFile(null);
    setImageHint(null);
  };

  const visibles = products.filter((p) => {
    const t = filtro.trim().toLowerCase();
    if (!t) return true;
    return (
      p.name.toLowerCase().includes(t) ||
      (p.code || '').toLowerCase().includes(t) ||
      (p.category || '').toLowerCase().includes(t)
    );
  });

  const idsVisibles = visibles.map((p) => p.id);
  const todosVisiblesSeleccionados =
    idsVisibles.length > 0 && idsVisibles.every((id) => seleccion.has(id));

  const alternarUno = (id: string) => {
    setSeleccion((prev) => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id);
      else s.add(id);
      return s;
    });
  };

  /**
   * Sin filtro no hay forma de tomar todo de un clic (spec del borrado masivo):
   * con el filtro vacio "visibles" es el catalogo entero, y un clic mas
   * "Aceptar" borraba todos los productos y sus filas de la hoja.
   */
  const hayFiltro = filtro.trim() !== '';

  /** Selecciona solo lo filtrado. */
  const alternarVisibles = () => {
    if (!hayFiltro) return;
    setSeleccion((prev) => {
      const s = new Set(prev);
      if (todosVisiblesSeleccionados) idsVisibles.forEach((id) => s.delete(id));
      else idsVisibles.forEach((id) => s.add(id));
      return s;
    });
  };

  const handleBorrarSeleccionados = async () => {
    const ids = [...seleccion];
    if (ids.length === 0) return;

    const elegidos = products.filter((p) => seleccion.has(p.id));
    const muestra = elegidos
      .slice(0, 8)
      .map((p) => `- ${p.code || '--'} ${p.name}`)
      .join('\n');
    const resto =
      elegidos.length > 8 ? `\n...y ${elegidos.length - 8} mas` : '';

    const confirmado = confirm(
      [
        `Se van a borrar ${ids.length} productos y sus filas en la hoja de calculo.`,
        '',
        muestra + resto,
        '',
        'Esta accion no se puede deshacer.',
      ].join('\n')
    );

    if (!confirmado) return;

    setBorrando(true);
    setAvisoHoja(null);

    try {
      const res = await fetch('/api/products', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setAvisoHoja(data.error || 'No se pudieron borrar los productos.');
        return;
      }

      setSeleccion(new Set());
      await loadProducts();
      await loadDiagnostics();

      const sinFila = data.sinFila?.length
        ? ` ${data.sinFila.length} no tenian fila en la hoja.`
        : '';
      setAvisoHoja(
        `Se borraron ${data.borrados} productos y ${data.filasBorradas} filas de la hoja.${sinFila}`
      );
    } finally {
      setBorrando(false);
    }
  };

  // Borra de los dos lados, como el masivo: primero la fila de la hoja y
  // despues la base. Antes solo borraba en la base y la fila quedaba huerfana.
  const handleDelete = async (product: ProductItem) => {
    if (!confirm(`Eliminar "${product.name}"? Tambien se borra su fila de la hoja de precios.`)) return;
    setBorrandoId(product.id);
    setAvisoHoja(null);
    try {
      const res = await fetch(`/api/products/${product.id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setAvisoHoja(data.error || 'No se pudo borrar el producto.');
        return;
      }
      await loadProducts();
      await loadDiagnostics();
      setAvisoHoja(
        data.filasBorradas > 0
          ? `Se borró "${product.name}" y su fila de la hoja.`
          : `Se borró "${product.name}". No tenía fila en la hoja.`
      );
    } finally {
      setBorrandoId(null);
    }
  };

  return (
    <div>
      <div className="admin-pagina-cabecera">
        <h1 className="admin-h1">Productos</h1>
        {/* Sincronizar va arriba, junto a "Nuevo producto": el recuadro que lo
            contenia le quitaba a la lista casi 100 px para un solo boton. */}
        <div className="admin-actions">
          <button type="button" className="admin-btn primary" onClick={handleSincronizar} disabled={refrescando}>
            {refrescando && <span className="admin-spinner" aria-hidden="true" />}
            {refrescando ? 'Sincronizando...' : 'Sincronizar con la hoja'}
          </button>
          <button type="button" className="admin-btn accent" onClick={abrirNuevo}>
            + Nuevo producto
          </button>
        </div>
      </div>

      <AdminModal
        abierto={modalAbierto}
        titulo={editing ? 'Editar producto' : 'Nuevo producto'}
        onCerrar={cerrarModal}
      >
        <form className="admin-form" onSubmit={handleSubmit}>
          <label className="admin-campo">
            Nombre
            <input
              className="admin-input"
              placeholder="Ej. Suprema por Caja"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </label>
          <label className="admin-campo">
            Codigo interno o de barras
            <input
              className="admin-input"
              placeholder="Ej. 0020"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
            />
          </label>
          <div className="admin-campos-fila">
            <label className="admin-campo">
              Unidad de venta
              <select
                className="admin-select"
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
              >
                <option value="Kg">Kilogramo</option>
                <option value="Unidad">Unidad</option>
                <option value="Docena">Docena</option>
                <option value="Caja">Caja</option>
              </select>
            </label>
            <label className="admin-campo">
              Cantidad por venta
              <input
                className="admin-input"
                placeholder="Ej. 15 (kg de la caja); 1 si es suelto"
                type="number"
                min="0.01"
                step="0.01"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              />
            </label>
          </div>
          <label className="admin-campo">
            Peso aprox. por pieza (kg) — solo si el precio de la hoja es por kilo
            <input
              className="admin-input"
              placeholder="Ej. 10. Vacio si el precio es cerrado"
              type="number"
              min="0.1"
              step="0.1"
              value={form.pesoAprox}
              onChange={(e) => setForm({ ...form, pesoAprox: e.target.value })}
            />
          </label>
          <label className="admin-helper" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input
              type="checkbox"
              checked={form.isOffer}
              onChange={(e) => setForm({ ...form, isOffer: e.target.checked })}
            />
            Es una oferta (badge y fila del inicio; no cambia precios)
          </label>
          {editing ? (
            <label className="admin-campo">
              Precio (se escribe en la hoja y en la base)
              <input
                className="admin-input"
                type="number"
                min="0"
                step="1"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
            </label>
          ) : (
            <label className="admin-campo">
              Precio inicial (opcional)
              <input
                className="admin-input"
                placeholder="Con precio se publica; vacio queda apagado hasta activarlo en la hoja"
                type="number"
                min="0"
                step="1"
                value={form.initialPrice}
                onChange={(e) => setForm({ ...form, initialPrice: e.target.value })}
              />
            </label>
          )}
          <label className="admin-campo">
            Rubro
            <select
              className="admin-select"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              required
            >
              <option value="">Seleccionar rubro</option>
              {PRODUCT_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>
          <label className="admin-campo">
            Stock (opcional)
            <input
              className="admin-input"
              placeholder="Ej. Disponible, Agotado"
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: e.target.value })}
            />
          </label>
          <label className="admin-campo">
            Descripcion (opcional)
            <textarea
              className="admin-textarea"
              placeholder="Se muestra en la card del catalogo"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </label>
          <label className="admin-campo">
            Foto (opcional si la hoja nombra una del catalogo comun)
            <input
              className="admin-input"
              type="file"
              accept="image/*"
              onChange={(e) => handleImageChange(e.target.files?.[0] || null)}
            />
          </label>
          <p className="admin-helper">
            Relación 4:3, de {`${PRODUCT_CARD_IMAGE_RECOMMENDED_UPLOAD.width}×${PRODUCT_CARD_IMAGE_RECOMMENDED_UPLOAD.height}`} px o más. Con otra relación se ve entera,
            con barras a los costados: conviene fondo liso y el producto centrado.
          </p>
          {imageHint && (
            <p className={`admin-helper ${imageHintType === 'warning' ? 'warning' : 'info'}`}>{imageHint}</p>
          )}

          {formError && <p className="admin-error">{formError}</p>}
          {avisoHoja && <p className="admin-helper info">{avisoHoja}</p>}

          <div className="admin-actions">
            <button className="admin-btn primary" disabled={loading}>
              {loading && <span className="admin-spinner" aria-hidden="true" />}
              {loading ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear'}
            </button>
            <button type="button" className="admin-btn secondary" onClick={cerrarModal} disabled={loading}>
              Cancelar
            </button>
          </div>
        </form>
      </AdminModal>

      <section className="admin-card">

        {errorCarga && (
          <div className="admin-estado-hoja">
            <p className="admin-error">{errorCarga}</p>
            <button
              type="button"
              className="admin-btn secondary"
              disabled={reintentando}
              onClick={async () => {
                setReintentando(true);
                await loadProducts();
                setReintentando(false);
              }}
            >
              {reintentando && <span className="admin-spinner" aria-hidden="true" />}
              Reintentar
            </button>
          </div>
        )}
        {avisoHoja && !loading && !diag && <p className="admin-helper info admin-estado-hoja">{avisoHoja}</p>}

        {errorDiag && !diag && <p className="admin-helper warning admin-estado-hoja">{errorDiag}</p>}

        {diag && (
          <div className="admin-estado-hoja">
            {avisoHoja && !loading && (
              <p className="admin-helper info">{avisoHoja}</p>
            )}

            {diag.stale ? (
              <p className="admin-helper warning">
                No se pudo leer la hoja de calculo. Se muestran los ultimos precios conocidos.
              </p>
            ) : (
              <p className="admin-helper info">
                Hoja Precios leída correctamente
                {diag.readAt
                  ? ` el ${fechaHoraCompleta(diag.readAt)}`
                  : ''}
                . Publicados: {diag.publicados}.
              </p>
            )}

            {diag.diagnostics.missingRows.length > 0 && (
              <p className="admin-helper warning">
                Sin fila en la hoja, no se publican: {diag.diagnostics.missingRows.join(', ')}
              </p>
            )}
            {diag.diagnostics.orphanRows.length > 0 && (
              <p className="admin-helper warning">
                Filas de la hoja sin producto en la base: {diag.diagnostics.orphanRows.join(', ')}
              </p>
            )}
            {diag.diagnostics.invalidPrices.length > 0 && (
              <p className="admin-helper warning">
                Precio no numerico o en cero (en cero no se publica; si no es un numero, se usa el ultimo precio bueno):{' '}
                {diag.diagnostics.invalidPrices.join(', ')}
              </p>
            )}
            {(diag.diagnostics.codigosRepetidos?.length ?? 0) > 0 && (
              <p className="admin-helper warning">
                Codigos repetidos en la hoja, corregilos ahi para poder editar su precio o su codigo:{' '}
                {diag.diagnostics.codigosRepetidos?.join(', ')}
              </p>
            )}
          </div>
        )}

        <input
          className="admin-input"
          placeholder="Filtrar por nombre, codigo o rubro"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          style={{ marginBottom: '0.5rem' }}
        />

        {seleccion.size > 0 && (
          <div className="admin-bulk-bar">
            <span>{seleccion.size} seleccionados</span>
            <div className="admin-actions">
              <button
                type="button"
                className="admin-btn secondary"
                onClick={() => setSeleccion(new Set())}
                disabled={borrando}
              >
                Quitar seleccion
              </button>
              <button
                type="button"
                className="admin-btn danger"
                onClick={handleBorrarSeleccionados}
                disabled={borrando}
              >
                {borrando ? (
                  <>
                    <span className="admin-spinner" aria-hidden="true" />
                    Borrando...
                  </>
                ) : (
                  'Borrar seleccionados'
                )}
              </button>
            </div>
          </div>
        )}

        <p className="admin-helper">
          Mostrando {visibles.length} de {products.length} productos.
        </p>

        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '2rem' }}>
                  <input
                    type="checkbox"
                    checked={todosVisiblesSeleccionados}
                    onChange={alternarVisibles}
                    aria-label="Seleccionar los productos visibles"
                    title={hayFiltro ? undefined : 'Filtrá primero para seleccionar varios de una vez'}
                    disabled={!hayFiltro || visibles.length === 0}
                  />
                </th>
                <th>Codigo</th>
                <th>Nombre</th>
                <th>Precio</th>
                <th>Categoria</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {visibles.map((product) => (
                <tr
                  key={product.id}
                  className={seleccion.has(product.id) ? 'admin-row-selected' : ''}
                >
                  <td>
                    <input
                      type="checkbox"
                      checked={seleccion.has(product.id)}
                      onChange={() => alternarUno(product.id)}
                      aria-label={`Seleccionar ${product.name}`}
                    />
                  </td>
                  <td>
                    {product.code || '-'}
                    {product.isOffer && (
                      <small className="admin-tag-offer">Oferta</small>
                    )}
                  </td>
                  <td>
                    {product.name}
                    <small className="admin-cell-note">
                      {product.quantity ?? 1} {product.unit || 'Unidad'}
                    </small>
                    {!product.imageUrl && !product.imagePublicId && (
                      <small className="admin-cell-note warning">sin foto</small>
                    )}
                  </td>
                  <td>
                    ${product.price}
                    {product.priceUpdatedAt ? (
                      <small className="admin-cell-note">
                        {fechaHoraCompleta(product.priceUpdatedAt)}
                      </small>
                    ) : (
                      <small className="admin-cell-note warning">
                        sin leer de la hoja
                      </small>
                    )}
                  </td>
                  <td>{product.category || '-'}</td>
                  <td>
                    <div className="admin-actions">
                      <button
                        className="admin-btn secondary"
                        onClick={() => handleEdit(product)}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className="admin-btn danger"
                        onClick={() => handleDelete(product)}
                        disabled={borrandoId === product.id || borrando}
                      >
                        {borrandoId === product.id && <span className="admin-spinner" aria-hidden="true" />}
                        Borrar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {visibles.length === 0 && (
                <tr>
                  <td colSpan={6} className="admin-muted">
                    {products.length === 0
                      ? 'No hay productos cargados.'
                      : 'Ningun producto coincide con el filtro.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
