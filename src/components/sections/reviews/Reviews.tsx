import ReviewCard from '@/components/sections/reviewCard/ReviewCard';
import '@components/sections/reviews/Reviews.css';

/**
 * Reseñas de ejemplo de la demo, con textos y nombres inventados. Sin enlace a
 * reseñas de Google: el comercio no existe. Cada comercio pone las suyas.
 */
const RESENAS = [
  {
    autor: 'Marta, vecina del barrio',
    texto: 'Hago el pedido el viernes a la noche y el sábado a la mañana lo paso a buscar armado. El asado siempre viene como lo pedí.',
  },
  {
    autor: 'Julián',
    texto: 'Me aconsejaron un corte para el horno que no conocía y quedó buenísimo. Se nota que saben lo que venden.',
  },
  {
    autor: 'Sofía',
    texto: 'Pido la caja de pollo para toda la semana y me la traen a casa. Rápido, prolijo y con el precio claro desde el principio.',
  },
  {
    autor: 'Diego',
    texto: 'Ver los precios en la web antes de ir me ahorra tiempo. Y si algo cambia, me avisan por WhatsApp antes de cobrarme.',
  },
];

const Reviews = () => {
  return (
    <section id="reviews" className="reviews-section">
      <div className="container">
        <h2 className="section-title">Nuestros clientes</h2>
        <p className="section-subtitle">Reseñas de ejemplo para la demo.</p>

        <div className="reviews-grid">
          {RESENAS.map((r) => (
            <ReviewCard key={r.autor} text={r.texto} author={r.autor} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Reviews;
