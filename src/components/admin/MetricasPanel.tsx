'use client';

import { useState, useSyncExternalStore, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { formatPrice } from '@/lib/productUtils';
import type { Metricas, Periodo, PuntoSerie, ResumenPeriodo } from '@/lib/metricas';
import './MetricasPanel.css';

const CLAVE = 'elancla.metricas.periodo';

const PERIODOS = ['dia', 'semana', 'mes'] as const;
const NOMBRE: Record<Periodo, string> = { dia: 'Día', semana: 'Semana', mes: 'Mes' };

/** El calculo va en centavos; la pantalla, en pesos enteros. */
const pesos = (centavos: number) => formatPrice(Math.round(centavos / 100));

/**
 * La solapa guardada se lee con useSyncExternalStore: el servidor dibuja "mes"
 * (getServerSnapshot) y el cliente lee localStorage despues de hidratar. Leerla
 * en el render inicial daba error de hidratacion con otra solapa guardada.
 */
const sinSuscripcion = () => () => {};
function leerGuardado(): Periodo {
  try {
    const v = localStorage.getItem(CLAVE);
    return v === 'dia' || v === 'semana' ? v : 'mes';
  } catch {
    return 'mes';
  }
}

const TEXTO: Record<Periodo, { este: string; anterior: string }> = {
  dia: { este: 'hoy', anterior: 'Ayer' },
  mes: { este: 'este mes', anterior: 'Mes anterior' },
  semana: { este: 'esta semana', anterior: 'Semana anterior' },
};

export default function MetricasPanel({ metricas }: { metricas: Metricas | null }) {
  const router = useRouter();
  const [recargando, startTransition] = useTransition();
  const guardado = useSyncExternalStore(sinSuscripcion, leerGuardado, () => 'mes' as Periodo);
  const [elegido, setElegido] = useState<Periodo | null>(null);
  const periodo = elegido ?? guardado;

  const elegir = (p: Periodo) => {
    setElegido(p);
    try {
      localStorage.setItem(CLAVE, p);
    } catch {
      // Sin almacenamiento: la solapa funciona igual, solo no se recuerda.
    }
  };

  if (!metricas) {
    return (
      <div className="metricas-error">
        <p className="admin-error">No se pudieron cargar las métricas.</p>
        <button
          type="button"
          className="admin-btn secondary"
          disabled={recargando}
          onClick={() => startTransition(() => router.refresh())}
        >
          {recargando && <span className="admin-spinner" aria-hidden="true" />}
          Reintentar
        </button>
      </div>
    );
  }

  const { actual, anterior, serie } = metricas[periodo];
  const t = TEXTO[periodo];

  return (
    <div className="metricas">
      <div className="metricas-solapa" role="group" aria-label="Período">
        {PERIODOS.map((p) => (
          <button
            key={p}
            type="button"
            className={periodo === p ? 'activa' : ''}
            aria-pressed={periodo === p}
            onClick={() => elegir(p)}
          >
            {NOMBRE[p]}
          </button>
        ))}
      </div>

      <div className="metricas-tarjetas">
        <Tarjeta titulo="Clientes" valor={String(metricas.clientesTotal)}>
          +{actual.clientesNuevos} {actual.clientesNuevos === 1 ? 'nuevo' : 'nuevos'} {t.este}
        </Tarjeta>
        <Tarjeta titulo="Pedidos" valor={String(actual.pedidos)}>
          <Estados r={actual} />
        </Tarjeta>
        <Tarjeta titulo="Ventas" valor={pesos(actual.ventasCentavos)}>
          <span>
            {t.anterior}: {pesos(anterior.ventasCentavos)}
          </span>
          {actual.entregadosSinTicket > 0 && (
            <span className="metricas-sin-ticket">
              Incluye {actual.entregadosSinTicket}{' '}
              {actual.entregadosSinTicket === 1 ? 'pedido' : 'pedidos'} con el total estimado (sin ticket)
            </span>
          )}
        </Tarjeta>
        <Tarjeta titulo="Ticket promedio" valor={ticket(actual)}>
          {t.anterior}: {ticket(anterior)}
        </Tarjeta>
      </div>

      <Barras serie={serie} />

      <p className="metricas-nota">
        Ventas: suma de pedidos entregados, con el monto del ticket; si no tiene ticket, con el total estimado.
      </p>
    </div>
  );
}

const ticket = (r: ResumenPeriodo) => (r.ticketCentavos === null ? '—' : pesos(r.ticketCentavos));

function Tarjeta({ titulo, valor, children }: { titulo: string; valor: string; children: React.ReactNode }) {
  return (
    <section className="metricas-tarjeta">
      <h2>{titulo}</h2>
      <p className="metricas-valor">{valor}</p>
      <div className="metricas-detalle">{children}</div>
    </section>
  );
}

function Estados({ r }: { r: ResumenPeriodo }) {
  return (
    <>
      <span>
        En curso {r.pedidos - r.porEstado.entregado} · Entregados {r.porEstado.entregado}
      </span>
      <span className="metricas-cancelados">Cancelados: {r.porEstado.cancelado}</span>
    </>
  );
}

function Barras({ serie }: { serie: PuntoSerie[] }) {
  const max = Math.max(...serie.map((p) => p.ventasCentavos));
  if (max === 0) {
    return <p className="metricas-vacio">Todavía no hay pedidos entregados en este período.</p>;
  }
  return (
    <ol className="metricas-barras" aria-label="Ventas por período">
      {serie.map((p) => {
        const texto = `${p.rotulo}${p.enCurso ? ' (en curso)' : ''}: ${pesos(p.ventasCentavos)}`;
        return (
          <li key={p.inicio} className={p.enCurso ? 'en-curso' : ''} title={texto} aria-label={texto}>
            <span className="metricas-barra-monto" aria-hidden="true">
              {pesos(p.ventasCentavos)}
            </span>
            <span className="metricas-barra-zona" aria-hidden="true">
              <span className="metricas-barra" style={{ height: `${Math.max(2, (p.ventasCentavos / max) * 100)}%` }} />
            </span>
            <span className="metricas-barra-rotulo" aria-hidden="true">
              {p.rotulo}
              {p.enCurso && <small>en curso</small>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
