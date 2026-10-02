import AboutMe from '@/components/sections/aboutMe/AboutMe';
import ContactForm from '@/components/sections/contactForm/ContactForm';
import Footer from '@/components/layout/footer/Footer';
import Hero from '@/components/sections/hero/Hero';
import Reviews from '@/components/sections/reviews/Reviews';

/** Sin `revalidate`: Hero, ContactForm y Footer leen el store en el navegador. */
export default function HomePage() {
  return (
    <main className="flex flex-col">
      <Hero />
      <AboutMe />
      <Reviews />
      <ContactForm />
      <Footer />
    </main>
  );
}
