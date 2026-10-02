export interface LineaTotal {
  price: number;
  quantity: number;
  disponible: boolean;
}

/**
 * Total estimado en pesos enteros. "Estimado" porque el peso real se ajusta al pesar.
 *
 * Suma los subtotales **ya redondeados** de cada linea, no la suma cruda
 * redondeada al final: el mensaje de WhatsApp, el detalle y el panel escriben
 * cada linea redondeada, y el total tiene que coincidir con la suma que el
 * dueno hace a ojo. Con dos lineas de 1,5 kg a $ 6.999 la otra forma daba
 * $ 20.997 contra $ 10.499 + $ 10.499.
 */
export function totalEstimado(lineas: LineaTotal[]): number {
  return lineas
    .filter((l) => l.disponible)
    .reduce((acc, l) => acc + Math.round(l.price * l.quantity), 0);
}
