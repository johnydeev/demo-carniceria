'use client';

import { useCallback, useEffect, useState } from 'react';
import { DIAS, type DiaSemana, type HorarioConfig } from '@/lib/horario/esquema';
import { NOMBRE_DIA, textoHorario } from '@/lib/horario/texto';
import { fechaISO } from '@/lib/horario/tiempo';
import { soloFecha } from '@/lib/fechas';

type CampoNumero = 'margenRetiroMin' | 'margenEnvioMin' | 'diasAnticipacion';

export default function AdminHorarioPage() {
  const [horario, setHorario] = useState<HorarioConfig | null>(null);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<{ ok: boolean; texto: string } | null>(null);
  const [nuevaFecha, setNuevaFecha] = useState('');
  // El guardado no valida: se muestra el de por defecto y se avisa hasta guardar.
  const [guardadoInvalido, setGuardadoInvalido] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    setErrorCarga(false);
    try {
      const res = await fetch('/api/admin/horario');
      if (!res.ok) throw new Error();
      const data = await res.json();
      setHorario(data.horario);
      setGuardadoInvalido(Boolean(data.invalido));
    } catch {
      setErrorCarga(true);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const conDia = (dia: DiaSemana, cambiar: (turnos: HorarioConfig['semana'][DiaSemana]) => HorarioConfig['semana'][DiaSemana]) =>
    setHorario((h) => h && { ...h, semana: { ...h.semana, [dia]: cambiar(h.semana[dia]) } });

  const cambiarNumero = (campo: CampoNumero, valor: string) =>
    setHorario((h) => h && { ...h, [campo]: valor === '' ? 0 : Number(valor) });

  const agregarFecha = () => {
    if (!nuevaFecha) return;
    setHorario((h) => h && (h.fechasCerradas.includes(nuevaFecha) ? h : { ...h, fechasCerradas: [...h.fechasCerradas, nuevaFecha].sort() }));
    setNuevaFecha('');
  };

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!horario) return;
    setGuardando(true);
    setMensaje(null);
    try {
      const res = await fetch('/api/admin/horario', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(horario),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'No se pudo guardar el horario.');
      setHorario(data.horario);
      setGuardadoInvalido(false);
      setMensaje({ ok: true, texto: 'Horario guardado.' });
    } catch (err) {
      setMensaje({ ok: false, texto: err instanceof Error ? err.message : 'No se pudo guardar el horario.' });
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

  if (errorCarga || !horario) {
    return (
      <div className="admin-card">
        <h1 className="admin-h1">Horario</h1>
        <p className="admin-error">No se pudo leer el horario.</p>
        <button type="button" className="admin-btn secondary" onClick={cargar}>
          Reintentar
        </button>
      </div>
    );
  }

  const hoy = fechaISO(Date.now());

  return (
    <form className="admin-card horario" onSubmit={guardar}>
      <h1 className="admin-h1">Horario de pedidos</h1>
      <p className="admin-muted">Los clientes eligen uno de estos turnos para retirar o recibir su pedido.</p>
      {guardadoInvalido && (
        <p className="admin-helper warning" role="alert">
          El horario guardado tenía un error y no se pudo leer: mientras tanto no se pueden hacer pedidos. Abajo está el
          horario por defecto: revisalo y tocá &quot;Guardar&quot;.
        </p>
      )}

      <section className="horario-seccion">
        <h2>Semana</h2>
        {DIAS.map((dia) => {
          const turnos = horario.semana[dia];
          return (
            <div key={dia} className="horario-dia">
              <strong>{NOMBRE_DIA[dia]}</strong>
              {turnos.length === 0 && <span className="admin-muted">Cerrado</span>}
              {turnos.map((t, i) => (
                <span key={i} className="horario-turno">
                  <input
                    type="time"
                    className="admin-input"
                    value={t.abre}
                    aria-label={`${NOMBRE_DIA[dia]}, turno ${i + 1}, abre`}
                    onChange={(e) => conDia(dia, (ts) => ts.map((x, j) => (j === i ? { ...x, abre: e.target.value } : x)))}
                  />
                  a
                  <input
                    type="time"
                    className="admin-input"
                    value={t.cierra}
                    aria-label={`${NOMBRE_DIA[dia]}, turno ${i + 1}, cierra`}
                    onChange={(e) => conDia(dia, (ts) => ts.map((x, j) => (j === i ? { ...x, cierra: e.target.value } : x)))}
                  />
                  <button type="button" className="admin-btn secondary" onClick={() => conDia(dia, (ts) => ts.filter((_, j) => j !== i))}>
                    Quitar
                  </button>
                </span>
              ))}
              {turnos.length < 2 && (
                <button
                  type="button"
                  className="admin-btn secondary"
                  onClick={() =>
                    conDia(dia, (ts) => [...ts, ts.length === 0 ? { abre: '08:00', cierra: '13:00' } : { abre: '17:00', cierra: '20:00' }])
                  }
                >
                  {turnos.length === 0 ? 'Abrir este día' : 'Agregar turno de tarde'}
                </button>
              )}
            </div>
          );
        })}
      </section>

      <section className="horario-seccion">
        <h2>Cortes y anticipación</h2>
        <label className="admin-helper">
          Margen para retiro (minutos)
          <input type="number" min={0} max={240} className="admin-input" value={horario.margenRetiroMin} onChange={(e) => cambiarNumero('margenRetiroMin', e.target.value)} />
        </label>
        <label className="admin-helper">
          Margen para envío (minutos)
          <input type="number" min={0} max={240} className="admin-input" value={horario.margenEnvioMin} onChange={(e) => cambiarNumero('margenEnvioMin', e.target.value)} />
        </label>
        <p className="admin-muted">Un turno se ofrece hasta esa cantidad de minutos antes de cerrar.</p>
        <label className="admin-helper">
          Días de anticipación (1 a 5)
          <input type="number" min={1} max={5} className="admin-input" value={horario.diasAnticipacion} onChange={(e) => cambiarNumero('diasAnticipacion', e.target.value)} />
        </label>
      </section>

      <section className="horario-seccion">
        <h2>Fechas cerradas</h2>
        <div className="horario-turno">
          <input type="date" className="admin-input" value={nuevaFecha} min={hoy} onChange={(e) => setNuevaFecha(e.target.value)} aria-label="Fecha cerrada" />
          <button type="button" className="admin-btn secondary" onClick={agregarFecha} disabled={!nuevaFecha}>
            Agregar
          </button>
        </div>
        <ul className="horario-fechas">
          {horario.fechasCerradas
            .filter((f) => f >= hoy)
            .map((f) => (
              <li key={f}>
                {soloFecha(`${f}T12:00:00-03:00`)}
                <button
                  type="button"
                  className="admin-btn secondary"
                  onClick={() => setHorario((h) => h && { ...h, fechasCerradas: h.fechasCerradas.filter((x) => x !== f) })}
                >
                  Quitar
                </button>
              </li>
            ))}
        </ul>
      </section>

      <section className="horario-seccion">
        <h2>Así lo ve el cliente</h2>
        {textoHorario(horario).map((l) => (
          <p key={l} className="admin-muted">
            {l}
          </p>
        ))}
      </section>

      {mensaje && <p className={mensaje.ok ? 'admin-helper info' : 'admin-error'}>{mensaje.texto}</p>}
      <button type="submit" className="admin-btn primary" disabled={guardando}>
        {guardando && <span className="admin-spinner" aria-hidden="true" />}
        Guardar
      </button>
    </form>
  );
}
