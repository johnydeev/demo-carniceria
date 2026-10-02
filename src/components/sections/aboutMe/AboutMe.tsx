/* eslint-disable @next/next/no-img-element */
import { negocio } from '@/config/negocio.config';
import type { AboutMeProps } from '@/types/sectionComponents';
import '@components/sections/aboutMe/AboutMe.css';

const PILARES = [
  { cifra: `Desde ${negocio.fundado}`, texto: 'Más de veinte años atendiendo al mismo barrio.' },
  { cifra: negocio.direccion.localidad, texto: 'Comercio de cercanía: nos conocemos con los clientes por el nombre.' },
  { cifra: 'Pedidos online', texto: 'Armás el pedido en el sitio y lo retirás o te lo llevamos.' },
];

const AboutMe = ({ fotoLocal = negocio.fotoLocal }: AboutMeProps) => {
  return (
    <section id="about-me" className="about-section">
      <div className="container about-inner">
        <div className="about-text">
          <h2 className="section-title about-title">Más de 20 años en {negocio.direccion.localidad}</h2>
          <p className="about-lead">
            Somos la carnicería de la esquina: la de toda la vida, ahora también en la web.
            Cortamos a la vista, te aconsejamos qué llevar para cada comida y separamos tu
            pedido para que lo retires sin hacer fila o te llegue a tu casa.
          </p>
          <ul className="about-pilares">
            {PILARES.map((p) => (
              <li key={p.cifra} className="about-pilar">
                <span className="about-pilar-cifra">{p.cifra}</span>
                <span className="about-pilar-texto">{p.texto}</span>
              </li>
            ))}
          </ul>
        </div>

        {fotoLocal && (
          <div className="about-foto">
            <img
              src={fotoLocal}
              alt={`Local de ${negocio.nombre} en ${negocio.direccion.localidad}`}
              width={800}
              height={600}
              loading="lazy"
            />
          </div>
        )}
      </div>
    </section>
  );
};

export default AboutMe;
