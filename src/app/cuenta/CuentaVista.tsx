'use client';

import { useState } from 'react';
import { Loader2, Pencil } from 'lucide-react';
import Modal from '@/components/modal/Modal';
import { direccionEnLinea } from '@/lib/orders/mensaje';
import type { Perfil } from '@/demo/tipos';

type Datos = Pick<Perfil, 'name' | 'phone' | 'address' | 'addressNotes'>;

/**
 * Mi cuenta: los datos se muestran fijos y solo cambian desde el modal de
 * "Editar". Entrar a la pagina no abre un formulario (pedido del dueno): un
 * campo editable a la vista invita a tocarlo sin querer.
 */
export default function CuentaVista({ perfil }: { perfil: Perfil }) {
  const [datos, setDatos] = useState<Datos>({
    name: perfil.name,
    phone: perfil.phone,
    address: perfil.address,
    addressNotes: perfil.addressNotes,
  });
  const [editando, setEditando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);

  const direccion = direccionEnLinea(datos.address, datos.addressNotes);

  return (
    <section className="cuenta-vista">
      <header className="cuenta-vista-cabecera">
        <p className="cuenta-email">{perfil.email}</p>
        <button
          type="button"
          className="cuenta-editar"
          onClick={() => {
            setMensaje(null);
            setEditando(true);
          }}
        >
          <Pencil size={16} aria-hidden="true" />
          Editar
        </button>
      </header>

      <dl className="cuenta-datos">
        <Dato etiqueta="Nombre" valor={datos.name} />
        <Dato etiqueta="Teléfono" valor={datos.phone} />
        <Dato etiqueta="Dirección" valor={direccion} />
      </dl>

      {mensaje && (
        <p className="cuenta-mensaje" role="status">
          {mensaje}
        </p>
      )}

      {editando && (
        <EditarCuentaModal
          inicial={datos}
          onCerrar={() => setEditando(false)}
          onGuardado={(d) => {
            setDatos(d);
            setEditando(false);
            setMensaje('Datos guardados.');
          }}
        />
      )}
    </section>
  );
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="cuenta-dato">
      <dt>{etiqueta}</dt>
      <dd className={valor.trim() ? '' : 'vacio'}>{valor.trim() || 'Sin cargar'}</dd>
    </div>
  );
}

/** Montarlo solo mientras esta abierto: el estado arranca de `inicial`. */
function EditarCuentaModal({
  inicial,
  onCerrar,
  onGuardado,
}: {
  inicial: Datos;
  onCerrar: () => void;
  onGuardado: (d: Datos) => void;
}) {
  const [form, setForm] = useState<Datos>(inicial);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cambiar = (clave: keyof Datos) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [clave]: e.target.value }));

  const valido = form.name.trim() !== '';

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    // Por si el modal se abre algun dia desde adentro de otro formulario: en
    // React el submit sube por el arbol aunque el modal vaya por portal.
    e.stopPropagation();
    if (!valido || guardando) return;
    setGuardando(true);
    setError(null);
    try {
      const res = await fetch('/api/cuenta', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'No pudimos guardar. Probá de nuevo.');
      const p = data.perfil ?? {};
      onGuardado({
        name: p.name ?? form.name.trim(),
        phone: p.phone ?? '',
        address: p.address ?? '',
        addressNotes: p.addressNotes ?? '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos guardar. Probá de nuevo.');
      setGuardando(false);
    }
  };

  return (
    <Modal abierto titulo="Editar mis datos" onCerrar={onCerrar} bloqueado={guardando}>
      <form className="modal-form" onSubmit={guardar}>
        <label>
          Nombre
          <input value={form.name} onChange={cambiar('name')} maxLength={80} required autoComplete="name" />
        </label>
        <label>
          Teléfono
          <input
            value={form.phone}
            onChange={cambiar('phone')}
            maxLength={30}
            inputMode="tel"
            autoComplete="tel"
            placeholder="11 1234 5678"
          />
        </label>
        <label>
          Dirección
          <input
            value={form.address}
            onChange={cambiar('address')}
            maxLength={160}
            autoComplete="street-address"
            placeholder="Calle y número, localidad"
          />
        </label>
        <label>
          Piso, timbre, referencia
          <input value={form.addressNotes} onChange={cambiar('addressNotes')} maxLength={160} />
        </label>
        {error && <p className="modal-error">{error}</p>}
        <div className="modal-acciones">
          <button type="button" className="modal-cancelar" onClick={onCerrar} disabled={guardando}>
            Cancelar
          </button>
          <button type="submit" className="modal-guardar" disabled={!valido || guardando}>
            {guardando && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
            Guardar
          </button>
        </div>
      </form>
    </Modal>
  );
}
