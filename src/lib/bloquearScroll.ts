/**
 * Bloquea el scroll de la pagina mientras hay un panel o modal abierto.
 *
 * `overflow: hidden` en body saca la barra de scroll y la pagina se corria
 * unos 15 px a la derecha. Se compensa con un `padding-right` del ancho de la
 * barra. No se usa `scrollbar-gutter: stable` porque deja una franja sin
 * oscurecer al costado del fondo del panel.
 *
 * Devuelve la funcion que desbloquea.
 */
export function bloquearScroll(): () => void {
  const body = document.body;
  const barra = window.innerWidth - document.documentElement.clientWidth;
  const previo = { overflow: body.style.overflow, paddingRight: body.style.paddingRight };

  body.style.overflow = 'hidden';
  if (barra > 0) body.style.paddingRight = `${barra}px`;

  return () => {
    body.style.overflow = previo.overflow;
    body.style.paddingRight = previo.paddingRight;
  };
}
