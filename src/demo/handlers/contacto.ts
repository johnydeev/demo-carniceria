/**
 * Portado de src/app/api/send-email/route.ts: mismo esquema y mismas
 * respuestas, pero sin correos. El email se valida con `pareceEmail`, la misma
 * regla que la expresion de la ruta real. Sin limite por IP: en el navegador
 * no hay nada que proteger.
 */
import { http, HttpResponse } from 'msw';
import { z } from 'zod';
import { validar } from '../../lib/validar.ts';
import { pareceEmail } from '../../lib/admins/reglas.ts';

const ContactoSchema = z.object({
  name: z.string().trim().min(1, { error: 'Falta el nombre.' }).max(80, { error: 'El nombre es muy largo.' }),
  email: z
    .string()
    .trim()
    .max(160, { error: 'El email es muy largo.' })
    .refine(pareceEmail, { error: 'Email inválido.' }),
  message: z.string().trim().min(1, { error: 'Falta el mensaje.' }).max(2000, { error: 'El mensaje es muy largo.' }),
  /** Campo trampa: invisible para una persona, un bot lo completa. */
  sitio: z.string().optional(),
});

export const handlersContacto = [
  http.post('*/api/send-email', async ({ request }) => {
    const v = validar(ContactoSchema, await request.json().catch(() => ({})));
    if (!v.ok) return HttpResponse.json({ message: v.error }, { status: 400 });

    // En la demo no sale ningun correo: se responde lo mismo que cuando la ruta real los manda.
    return HttpResponse.json({ message: 'Email enviado exitosamente' }, { status: 200 });
  }),
];
