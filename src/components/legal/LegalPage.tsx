import type { LegalDoc } from '@/types/legal';
import '@components/legal/LegalPage.css';

/** Formatea la fecha ISO del documento sin depender de la zona del servidor. */
function formatearFecha(iso: string): string {
  const [anio, mes, dia] = iso.split('-').map(Number);
  return new Date(Date.UTC(anio, mes - 1, dia)).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

/**
 * Presentacional: dibuja un documento legal de `legal.config.ts`.
 * El contenido no vive aca.
 */
const LegalPage = ({ doc }: { doc: LegalDoc }) => (
  <main className="legal-page">
    <div className="container-sm">
      <header className="legal-header">
        <h1 className="legal-title">{doc.titulo}</h1>
        <p className="legal-fecha">Última actualización: {formatearFecha(doc.actualizado)}</p>
        <p className="legal-intro">{doc.intro}</p>
      </header>

      {doc.secciones.map((seccion) => (
        <section key={seccion.titulo} className="legal-seccion">
          <h2 className="legal-seccion-titulo">{seccion.titulo}</h2>

          {seccion.parrafos?.map((parrafo) => (
            <p key={parrafo} className="legal-parrafo">
              {parrafo}
            </p>
          ))}

          {seccion.lista && (
            <ul className="legal-lista">
              {seccion.lista.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}

          {seccion.cierre && <p className="legal-parrafo">{seccion.cierre}</p>}
        </section>
      ))}
    </div>
  </main>
);

export default LegalPage;
