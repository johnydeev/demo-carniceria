/**
 * Del telefono que el cliente escribio, tal cual, al numero que espera wa.me:
 * 54 + 9 + codigo de area sin 0 + numero sin 15. Puro, con tests.
 *
 * El panel anteponia `549` a todo lo que no empezara con 54, y un "011 15
 * 1234-5678" quedaba `54901115...`, que no existe. Un numero argentino tiene
 * 10 digitos entre area y abonado; con el 15 del celular son 12. Si no encaja
 * en ninguna forma conocida devuelve null y el panel muestra el texto sin
 * enlace: mejor sin enlace que un enlace a otra persona.
 */
export function numeroWhatsApp(telefono: string): string | null {
  let d = telefono.replace(/\D/g, '');

  if (d.startsWith('549') && d.length === 13) return d;
  // 54 sin el 9 de celular: se agrega.
  if (d.startsWith('54') && d.length === 12) return `549${d.slice(2)}`;

  if (d.startsWith('0')) d = d.slice(1);

  // "15 1234-5678": celular sin codigo de area. Mide 10 como un numero
  // completo, pero no dice de que area es; adivinar arma un enlace a otra persona.
  if (d.length === 10 && d.startsWith('15')) return null;

  // Con el 15: el area mide 2, 3 o 4 digitos y el 15 va justo despues.
  if (d.length === 12) {
    for (const area of [2, 3, 4]) {
      if (d.slice(area, area + 2) === '15') {
        d = d.slice(0, area) + d.slice(area + 2);
        break;
      }
    }
  }

  return d.length === 10 ? `549${d}` : null;
}
