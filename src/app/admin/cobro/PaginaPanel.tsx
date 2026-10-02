'use client';

import { useCallback, useEffect, useState } from 'react';
import { fechaHoraCompleta } from '@/lib/fechas';
import { MAX_ARCHIVO_TOPE_MB } from '@/lib/orders/cobro';
import type { CobroVista } from '@/demo/tipos';

interface Formulario {
  alias: string;
  titular: string;
  /** Texto del campo: vacio mientras se escribe; se convierte al guardar. */
  maxArchivoMB: string;
}

const aFormulario = (c: CobroVista): Formulario => ({
  alias: c.alias,
  titular: c.titular,
  maxArchivoMB: String(c.maxArchivoMB),
});

export default function AdminCobroPage() {
  const [form, setForm] = useState<Formulario | null>(null);
  const [ultima, setUltima] = useState<{ por: string | null; en: string | null }>({ por: null, en: null });
  const [puedeEditar, setPuedeEditar] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<{ ok: boolean; texto: string } | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setErrorCarga(false);
    try {
      const res = await fetch('/api/admin/cobro');
      if (!res.ok) throw new Error();
      const data: { cobro: CobroVista; puedeEditar: boolean } = await res.json();
      setForm(aFormulario(data.cobro));
      setUltima({ por: data.cobro.actualizadoPor, en: data.cobro.updatedAt });
      setPuedeEditar(data.puedeEditar);
    } catch {
      setErrorCarga(true);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const cambiar = (campo: keyof Formulario) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => f && { ...f, [campo]: e.target.value });

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form || !puedeEditar) return;
    setGuardando(true);
    setMensaje(null);
    try {
      const res = await fetch('/api/admin/cobro', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alias: form.alias, titular: form.titular, maxArchivoMB: Number(form.maxArchivoMB) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'No se pudieron guardar los datos de cobro.');
      setForm(aFormulario(data.cobro));
      setUltima({ por: data.cobro.actualizadoPor, en: data.cobro.updatedAt });
      setMensaje({ ok: true, texto: 'Datos de cobro guardados.' });
    } catch (err) {
      setMensaje({ ok: false, texto: err instanceof Error ? err.message : 'No se pudieron guardar los datos de cobro.' });
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return (
      <div className="admin-card">
        <p className="admin-muted">
          <span className="admin-spinner" aria-hidden="true" />
          Cargando…
        </p>
      </div>
    );
  }

  // "No se pudieron leer", nunca un formulario vacio: haria creer que falta cargar el alias.
  if (errorCarga || !form) {
    return (
      <div className="admin-card">
        <h1 className="admin-h1">Cobro</h1>
        <p className="admin-error">No se pudieron leer los datos de cobro.</p>
        <button type="button" className="admin-btn secondary" onClick={cargar}>
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <form className="admin-card" onSubmit={guardar}>
      <h1 className="admin-h1">Datos de cobro</h1>
      <p className="admin-muted">
        El alias y el titular van en el aviso de WhatsApp al cliente que paga por transferencia. El tamaño máximo vale
        para las fotos de tickets y comprobantes.
      </p>
      {!puedeEditar && (
        <p className="admin-helper warning">Solo el administrador principal puede cambiar estos datos.</p>
      )}

      <div className="admin-form">
        <label className="admin-campo">
          Alias, CBU o CVU
          <input
            className="admin-input"
            value={form.alias}
            onChange={cambiar('alias')}
            maxLength={60}
            readOnly={!puedeEditar}
          />
        </label>
        <label className="admin-campo">
          Titular de la cuenta
          <input
            className="admin-input"
            value={form.titular}
            onChange={cambiar('titular')}
            maxLength={80}
            readOnly={!puedeEditar}
          />
        </label>
        <label className="admin-campo">
          Tamaño máximo de archivo (MB)
          <input
            type="number"
            className="admin-input"
            value={form.maxArchivoMB}
            onChange={cambiar('maxArchivoMB')}
            min={1}
            max={MAX_ARCHIVO_TOPE_MB}
            step={1}
            readOnly={!puedeEditar}
          />
        </label>
      </div>

      {ultima.en && (
        <p className="admin-muted">
          Última modificación: {fechaHoraCompleta(ultima.en)}
          {ultima.por ? `, ${ultima.por}` : ''}
        </p>
      )}

      {mensaje && <p className={mensaje.ok ? 'admin-helper info' : 'admin-error'}>{mensaje.texto}</p>}

      {puedeEditar && (
        <div className="admin-actions">
          <button type="submit" className="admin-btn primary" disabled={guardando}>
            {guardando && <span className="admin-spinner" aria-hidden="true" />}
            Guardar
          </button>
        </div>
      )}
    </form>
  );
}
