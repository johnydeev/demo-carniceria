import type { LegalDoc } from '@/types/legal';
import { negocio } from '@/config/negocio.config';

/**
 * Textos legales de la demo. Describen lo que la demo hace de verdad: nada sale
 * del navegador. No son los de la app real (que hablan del login con Google,
 * de donde se alojan los datos y de una direccion): cada comercio publica los
 * suyos.
 */

export const politicaPrivacidad: LegalDoc = {
  titulo: 'Política de privacidad',
  actualizado: '2026-10-01',
  intro: `Este sitio es una demostración: ${negocio.nombre} es un comercio de ejemplo. No hay cuentas reales y nada de lo que hagas acá viaja a un servidor: queda guardado en tu navegador.`,
  secciones: [
    {
      titulo: 'Qué se guarda',
      parrafos: [
        'Lo que hacés en la demo —el carrito, los pedidos de prueba, los datos de perfil que escribas y los cambios en el panel del comercio— se guarda en el almacenamiento local de tu navegador, en este dispositivo.',
        'Nadie más lo ve: cada visitante tiene su propia copia de la demo.',
      ],
    },
    {
      titulo: 'Qué no se guarda ni se envía',
      lista: [
        'No hay inicio de sesión con Google: "Entrar como cliente" y "Entrar como dueño" eligen un usuario de ejemplo.',
        'El formulario de contacto no manda ningún correo.',
        'WhatsApp no se abre: se muestra el mensaje que saldría.',
        'Las fotos que subas en el panel quedan en tu navegador y no se publican en ningún lado.',
      ],
    },
    {
      titulo: 'Cookies',
      parrafos: [
        'La demo no usa cookies de publicidad ni rastreadores. El sitio está alojado en Vercel, que registra el tráfico como cualquier servidor web.',
      ],
    },
    {
      titulo: 'Cómo borrar todo',
      parrafos: [
        '"Reiniciar demo", en la barra de arriba, vuelve todo al estado inicial. También podés borrar los datos de este sitio desde la configuración de tu navegador. Además, la demo se reinicia sola una vez por día.',
      ],
    },
    {
      titulo: 'En la versión de tu comercio',
      parrafos: [
        'Cada comercio publica su propia política, que explica el inicio de sesión con Google, dónde se guardan los datos de los pedidos y con quién se comparten.',
      ],
    },
  ],
};

export function terminosCondiciones(horarios: string[]): LegalDoc {
  return {
    titulo: 'Términos y condiciones',
    actualizado: '2026-10-01',
    intro: `Este sitio es una demostración de la tienda online de ${negocio.nombre}, un comercio de ejemplo. Nada de lo que pase acá es una compra.`,
    secciones: [
      {
        titulo: 'Qué es este sitio',
        parrafos: [
          'Muestra cómo funciona una tienda online para una carnicería: el catálogo con precios, el carrito, el pedido por WhatsApp y el panel del comercio.',
          'Los productos, los precios, los clientes y los pedidos son de ejemplo. Las fotos son ilustrativas.',
        ],
      },
      {
        titulo: 'Pedidos',
        parrafos: [
          'Un pedido hecho en la demo no se prepara ni se entrega, y no se cobra nada. Sigue los mismos pasos que en la versión real:',
        ],
        lista: [
          'Recibido: llegó el pedido.',
          'En preparación: el comercio lo está armando.',
          'Preparado: ya está pesado y tiene el monto real.',
          'Listo para retirar o para enviar: el pago está verificado o se cobra en la entrega.',
          'Entregado.',
          'Cancelado.',
        ],
      },
      {
        titulo: 'Horario de ejemplo',
        parrafos: [`Retiro en el local, en el horario de atención de ejemplo: ${horarios.join('; ')}.`],
      },
      {
        titulo: 'Pago',
        parrafos: ['La demo no procesa pagos. El alias y el titular que aparecen son de ejemplo: no transfieras dinero.'],
      },
      {
        titulo: 'Tus datos',
        parrafos: ['Todo queda en tu navegador. Lo explica la política de privacidad.'],
      },
      {
        titulo: 'Cambios',
        parrafos: ['La demo puede cambiar o reiniciarse sin aviso.'],
      },
    ],
  };
}
