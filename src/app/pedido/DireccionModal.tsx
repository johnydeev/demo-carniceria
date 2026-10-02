'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import Modal from '@/components/modal/Modal';

export interface Direccion {
  address: string;
  addressNotes: string;
}

interface Props {
  inicial: Direccion;
  onCerrar: () => void;
  /** Con la direccion ya guardada en el perfil. */
  onGuardada: (d: Direccion) => void;
}

/**
 * Carga o edita el domicilio de entrega. En /pedido la direccion se muestra
 * fija y solo cambia aca: se guarda en el perfil (PUT /api/cuenta), asi el
 * pedido sale con la direccion registrada de la cuenta y la proxima vez ya
 * esta. Montarlo solo mientras esta abierto: el estado arranca de `inicial`.
 */
export default function DireccionModal({ inicial, onCerrar, onGuardada }: Props) {
  const [address, setAddress] = useState(inicial.address);
  const [addressNotes, setAddressNotes] = useState(inicial.addressNotes);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valida = address.trim() !== '';

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    // El modal va por portal, pero en React el evento sigue subiendo por el
    // arbol de componentes: sin esto, "Guardar" disparaba el onSubmit del
    // formulario de /pedido y mandaba el pedido.
    e.stopPropagation();
    if (!valida || guardando) return;
    setGuardando(true);
    setError(null);
    try {
      const res = await fetch('/api/cuenta', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, addressNotes }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'No se pudo guardar la dirección.');
      onGuardada({ address: data.perfil?.address ?? address.trim(), addressNotes: data.perfil?.addressNotes ?? '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar la dirección.');
      setGuardando(false);
    }
  };

  return (
    <Modal abierto titulo={inicial.address ? 'Editar dirección' : 'Cargar dirección'} onCerrar={onCerrar} bloqueado={guardando}>
      <form className="modal-form" onSubmit={guardar}>
        <label>
          Dirección
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            maxLength={160}
            required
            placeholder="Calle y número, localidad"
            autoComplete="street-address"
          />
        </label>
        <label>
          Piso, timbre, referencia
          <input value={addressNotes} onChange={(e) => setAddressNotes(e.target.value)} maxLength={160} />
        </label>
        {error && <p className="modal-error">{error}</p>}
        <div className="modal-acciones">
          <button type="button" className="modal-cancelar" onClick={onCerrar} disabled={guardando}>
            Cancelar
          </button>
          <button type="submit" className="modal-guardar" disabled={!valida || guardando}>
            {guardando && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
            Guardar
          </button>
        </div>
      </form>
    </Modal>
  );
}
