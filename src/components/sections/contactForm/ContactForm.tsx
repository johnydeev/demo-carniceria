'use client';

import { useState } from 'react';
import { negocio } from '@/config/negocio.config';
import { textoHorario } from '@/lib/horario/texto';
import { useHorario } from '@/demo/hooks';
import './ContactForm.css';

const ContactForm = () => {
  // En la demo el horario sale del store; hasta hidratar no se muestran las horas.
  const horario = useHorario();
  const horarios = horario ? textoHorario(horario) : [];
  const [form, setForm] = useState({ name: '', email: '', message: '', sitio: '' });
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'success' | 'error'>('success');
  const [modalMessage, setModalMessage] = useState('');


  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setModalType('success');
        setModalMessage(
          'En la demo no se envía ningún correo. En tu versión, el mensaje le llega al comercio y la persona recibe un acuse.'
        );
        setForm({ name: '', email: '', message: '', sitio: '' });
      } else {
        setModalType('error');
        setModalMessage(
          'Hubo un error al enviar tu mensaje. Por favor, intenta nuevamente.'
        );
      }
    } catch (error) {
      setModalType('error');
      setModalMessage(
        'Error inesperado. Verifica tu conexion e intenta nuevamente.'
      );
      console.error('Error:', error);
    } finally {
      setLoading(false);
      setShowModal(true);
    }
  };

  return (
    <>
      <section id="contact-form" className="contact-section">
        {/* Sin mapa embebido: el comercio de la demo no tiene direccion real. Queda el fondo. */}
        <div className="contact-map-background" aria-hidden="true">
          <div className="contact-map-overlay" />
        </div>

        <div className="contact-content">
          <article className="contact-info-panel">
            <span className="contact-kicker">Visitanos</span>
            <h2 className="contact-title">Estamos en {negocio.direccion.localidad}</h2>
            <p className="contact-text">
              Escribinos y te respondemos por disponibilidad, pedidos y horarios.
            </p>

            <div className="contact-badges">
              <span>{negocio.direccion.calle}</span>
              {horarios.map((h) => (
                <span key={h}>{h}</span>
              ))}
            </div>
          </article>

          <form onSubmit={handleSubmit} className="contact-form" noValidate>
            <div className="form-group">
              <label htmlFor="name" className="input-label">
                Nombre
              </label>
              <input
                type="text"
                id="name"
                name="name"
                placeholder="Ej: Maria Gomez"
                maxLength={80}
                value={form.name}
                onChange={handleChange}
                className="input-field"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email" className="input-label">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="Ej: contacto@email.com"
                maxLength={160}
                value={form.email}
                onChange={handleChange}
                className="input-field"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="message" className="input-label">
                Mensaje
              </label>
              <textarea
                id="message"
                name="message"
                placeholder="Contanos que necesitas"
                maxLength={2000}
                value={form.message}
                onChange={handleChange}
                className="input-field textarea-field"
                required
              />
            </div>

            {/* Campo trampa: una persona no lo ve ni lo alcanza con Tab; un bot
                que completa todo lo llena y el servidor descarta el mensaje. */}
            <div className="contact-trampa" aria-hidden="true">
              <label htmlFor="sitio">Sitio web</label>
              <input
                type="text"
                id="sitio"
                name="sitio"
                tabIndex={-1}
                autoComplete="off"
                value={form.sitio}
                onChange={handleChange}
              />
            </div>

            <div className="form-submit">
              <button type="submit" disabled={loading} className="submit-button">
                {loading ? <span className="spinner-inline" aria-hidden="true" /> : null}
                {loading ? 'Enviando...' : 'Enviar mensaje'}
                {!loading && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="button-icon" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            </div>
          </form>
        </div>
      </section>

      {loading && (
        <div className="loading-overlay" role="status" aria-live="polite">
          <div className="spinner-container">
            <div className="spinner" />
            <p className="loading-text">Enviando mensaje...</p>
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className={`modal-icon ${modalType}`}>
              {modalType === 'success' ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.72 6.97a.75.75 0 10-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 101.06 1.06L12 13.06l1.72 1.72a.75.75 0 101.06-1.06L13.06 12l1.72-1.72a.75.75 0 10-1.06-1.06L12 10.94l-1.72-1.72z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </div>
            <h3 className="modal-title">
              {modalType === 'success' ? 'Así funciona el contacto' : 'Error al enviar'}
            </h3>
            <p className="modal-message">{modalMessage}</p>
            <button onClick={() => setShowModal(false)} className="modal-button">
              Cerrar
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ContactForm;
