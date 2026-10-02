/**
 * Genera las imagenes de la demo en public/demo/. Se corre a mano
 * (`npm run imagenes`) cuando cambian las fotos o los carteles; la salida se
 * versiona: Vercel no corre este script.
 *
 * - Productos: cada foto de ../catalogo-comun/fotos/ en dos lienzos 4:3 con
 *   relleno del color del borde (720x540 y 360x270, WebP). Reemplaza el
 *   `c_pad,b_auto` de Cloudinary de la app real.
 * - Ilustraciones: para los productos de la semilla sin foto en el catalogo
 *   comun (fiambreria y almacen), un dibujo SVG en los mismos dos tamaños.
 * - Carteles: tres de 1200x500 armados desde SVG: texto sobre el color de
 *   marca y, en dos, una foto de producto.
 * - Marca: logo de texto (SVG y PNG), favicon e iconos del manifest.
 */
import sharp from 'sharp';
import { mkdir, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FOTOS = path.resolve(RAIZ, '..', 'catalogo-comun', 'fotos');
const PUBLICO = path.join(RAIZ, 'public', 'demo');
const PRODUCTOS = path.join(PUBLICO, 'productos');
const CARTELES = path.join(PUBLICO, 'carteles');
const MARCA = path.join(PUBLICO, 'marca');

// Los mismos valores que --color-brand, --color-brand-dark, --color-brand-tint,
// --color-accent, --color-offer y --color-cream de globals.css: el SVG
// renderiza fuera del DOM.
const BRAND = '#1f2a8c';
const BRAND_DARK = '#161f6b';
const BRAND_TINT = '#e9ebf7';
const ACCENT = '#e32226';
const OFFER = '#d6952b';
const CREAM = '#fbf8f2';

const EXTENSIONES = new Set(['.png', '.webp', '.jpg', '.jpeg']);

/** Promedio de los pixeles del borde de una miniatura 8x8: el color de relleno. */
async function colorDeBorde(archivo) {
  const { data, info } = await sharp(archivo)
    .flatten({ background: '#ffffff' })
    .resize(8, 8, { fit: 'fill' })
    .raw()
    .toBuffer({ resolveWithObject: true });
  let r = 0;
  let g = 0;
  let b = 0;
  let n = 0;
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      if (x > 0 && x < 7 && y > 0 && y < 7) continue;
      const i = (y * 8 + x) * info.channels;
      r += data[i];
      g += data[i + 1];
      b += data[i + 2];
      n++;
    }
  }
  return { r: Math.round(r / n), g: Math.round(g / n), b: Math.round(b / n), alpha: 1 };
}

async function lienzo(origen, ancho, alto, fondo, destino) {
  await sharp(origen)
    .flatten({ background: fondo })
    .resize(ancho, alto, { fit: 'contain', background: fondo })
    .webp({ quality: 80 })
    .toFile(destino);
}

async function productos() {
  await mkdir(PRODUCTOS, { recursive: true });
  const entradas = await readdir(FOTOS, { recursive: true, withFileTypes: true });
  const fotos = entradas.filter((e) => e.isFile() && EXTENSIONES.has(path.extname(e.name).toLowerCase()));
  for (const e of fotos) {
    const origen = path.join(e.parentPath, e.name);
    const nombre = path.basename(e.name, path.extname(e.name));
    const fondo = await colorDeBorde(origen);
    await lienzo(origen, 720, 540, fondo, path.join(PRODUCTOS, `${nombre}-720.webp`));
    await lienzo(origen, 360, 270, fondo, path.join(PRODUCTOS, `${nombre}-360.webp`));
  }
  console.log(`productos: ${fotos.length} fotos, ${fotos.length * 2} archivos`);
}

/*
 * Ilustraciones para los productos que el catalogo comun no tiene en foto
 * (fiambreria y almacen). Mismo lienzo 4:3 y mismos nombres que las fotos;
 * el prefijo `ilustracion-` evita que una foto futura con el mismo nombre las
 * pise o al reves. Sin texto: el nombre lo pone la card.
 */
const TRAZO = `stroke="${BRAND}" stroke-width="9" stroke-linejoin="round" stroke-linecap="round"`;

/**
 * Feta de jamon: ovalo crema (la grasa) con la carne adentro. El rosado es
 * `accent` con transparencia sobre crema: sin colores fuera de los tokens.
 */
function feta(x, y, rot) {
  return `<g transform="translate(${x} ${y}) rotate(${rot})">
    <ellipse rx="112" ry="80" fill="${CREAM}" ${TRAZO}/>
    <ellipse cx="-8" cy="4" rx="90" ry="62" fill="${ACCENT}" fill-opacity="0.42"/>
    <path d="M-52 -14 C-24 -30 6 -2 36 -20" fill="none" stroke="${CREAM}" stroke-width="6" stroke-linecap="round" opacity="0.8"/>
    <path d="M-40 26 C-14 12 12 36 40 20" fill="none" stroke="${CREAM}" stroke-width="6" stroke-linecap="round" opacity="0.8"/>
  </g>`;
}

/** Huevo centrado en el origen, ~160 de ancho y ~200 de alto. */
const HUEVO = 'M0 -100 C52 -100 80 -8 80 36 C80 78 46 100 0 100 C-46 100 -80 78 -80 36 C-80 -8 -52 -100 0 -100 Z';

const ILUSTRACIONES = [
  {
    nombre: 'ilustracion-jamon-cocido',
    dibujo: `${feta(300, 200, -14)}${feta(410, 270, -6)}${feta(330, 340, 4)}`,
  },
  {
    nombre: 'ilustracion-queso-maquina',
    dibujo: `<polygon points="215,265 505,265 455,170" fill="${OFFER}" fill-opacity="0.7" ${TRAZO}/>
    <rect x="215" y="265" width="290" height="115" fill="${OFFER}" ${TRAZO}/>
    <circle cx="268" cy="312" r="18" fill="${CREAM}" stroke="${BRAND}" stroke-width="5"/>
    <circle cx="340" cy="338" r="13" fill="${CREAM}" stroke="${BRAND}" stroke-width="5"/>
    <circle cx="410" cy="300" r="22" fill="${CREAM}" stroke="${BRAND}" stroke-width="5"/>
    <circle cx="465" cy="350" r="10" fill="${CREAM}" stroke="${BRAND}" stroke-width="5"/>
    <circle cx="402" cy="222" r="11" fill="${CREAM}" stroke="${BRAND}" stroke-width="5"/>`,
  },
  {
    nombre: 'ilustracion-huevos',
    dibujo: `<path d="${HUEVO}" transform="translate(275 250) rotate(-12) scale(0.8)" fill="${CREAM}" ${TRAZO}/>
    <path d="${HUEVO}" transform="translate(445 250) rotate(12) scale(0.8)" fill="${CREAM}" ${TRAZO}/>
    <path d="${HUEVO}" transform="translate(360 230) scale(0.9)" fill="${CREAM}" ${TRAZO}/>
    <path d="M190 300 H530 L505 395 Q500 410 485 410 H235 Q220 410 215 395 Z" fill="${BRAND}" ${TRAZO}/>
    <path d="M250 330 V385 M313 330 V385 M376 330 V385 M439 330 V385" stroke="${BRAND_TINT}" stroke-width="5" stroke-linecap="round" opacity="0.6"/>`,
  },
  {
    nombre: 'ilustracion-aceite-girasol',
    dibujo: `<rect x="338" y="92" width="44" height="34" rx="6" fill="${ACCENT}" ${TRAZO}/>
    <path d="M342 126 H378 V160 C378 178 420 186 420 222 V410 Q420 432 398 432 H322 Q300 432 300 410 V222 C300 186 342 178 342 160 Z" fill="${OFFER}" ${TRAZO}/>
    <path d="M318 228 V400" stroke="${CREAM}" stroke-width="8" stroke-linecap="round" opacity="0.6"/>
    <rect x="300" y="270" width="120" height="104" fill="${BRAND_TINT}" stroke="${BRAND}" stroke-width="9"/>
    <g transform="translate(360 322)">
      ${[0, 45, 90, 135, 180, 225, 270, 315].map((a) => `<ellipse cx="0" cy="-26" rx="10" ry="16" fill="${OFFER}" transform="rotate(${a})"/>`).join('')}
      <circle r="15" fill="${BRAND_DARK}"/>
    </g>`,
  },
];

function svgIlustracion(dibujo) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="540" viewBox="0 0 720 540">
  <rect width="720" height="540" fill="${BRAND_TINT}"/>
  <circle cx="360" cy="270" r="215" fill="${CREAM}"/>
  ${dibujo}
</svg>`;
}

async function ilustraciones() {
  await mkdir(PRODUCTOS, { recursive: true });
  for (const { nombre, dibujo } of ILUSTRACIONES) {
    const svg = Buffer.from(svgIlustracion(dibujo));
    await sharp(svg).resize(720, 540).webp({ quality: 85 }).toFile(path.join(PRODUCTOS, `${nombre}-720.webp`));
    await sharp(svg).resize(360, 270).webp({ quality: 85 }).toFile(path.join(PRODUCTOS, `${nombre}-360.webp`));
  }
  console.log(`ilustraciones: ${ILUSTRACIONES.length}, ${ILUSTRACIONES.length * 2} archivos`);
}

const CARTEL = [
  { archivo: 'cartel-asado', titulo: 'Asado para el finde', bajada: 'Tira, vacío y costillar cortados en el momento', foto: 'asado' },
  { archivo: 'cartel-pollo', titulo: 'Pollo fresco', bajada: 'Suprema, pata y muslo y alitas todos los días', foto: 'suprema' },
  { archivo: 'cartel-pedidos', titulo: 'Pedí por la web', bajada: 'Retirá sin esperar o te lo llevamos a tu casa', foto: null },
];

function svgCartel({ titulo, bajada }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="500" viewBox="0 0 1200 500">
  <defs>
    <linearGradient id="fondo" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${BRAND}"/>
      <stop offset="1" stop-color="${BRAND_DARK}"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="500" fill="url(#fondo)"/>
  <rect x="60" y="170" width="90" height="8" fill="${ACCENT}"/>
  <text x="60" y="250" font-family="Arial Black, Arial, sans-serif" font-weight="900" font-size="46" fill="#ffffff">${titulo}</text>
  <text x="60" y="305" font-family="Arial, sans-serif" font-size="26" fill="${CREAM}">${bajada}</text>
  <text x="60" y="440" font-family="Arial, sans-serif" font-size="22" fill="${CREAM}" opacity="0.8">Carnicería La Esquina · demo</text>
</svg>`;
}

async function carteles() {
  await mkdir(CARTELES, { recursive: true });
  for (const c of CARTEL) {
    const capas = [];
    if (c.foto) {
      const foto = await sharp(path.join(PRODUCTOS, `${c.foto}-720.webp`)).resize(420, 315).png().toBuffer();
      capas.push({ input: foto, left: 720, top: 92 });
    }
    const destino = path.join(CARTELES, `${c.archivo}.webp`);
    await sharp(Buffer.from(svgCartel(c))).composite(capas).webp({ quality: 85 }).toFile(destino);
    const { width, height } = await sharp(destino).metadata();
    if (width !== 1200 || height !== 500) throw new Error(`${c.archivo} mide ${width}x${height}`);
  }
  console.log(`carteles: ${CARTEL.length}`);
}

const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="520" height="160" viewBox="0 0 520 160">
  <rect x="20" y="24" width="12" height="112" fill="${ACCENT}"/>
  <text x="52" y="92" font-family="Arial Black, Arial, sans-serif" font-weight="900" font-size="56" fill="${BRAND}">La Esquina</text>
  <text x="54" y="130" font-family="Arial, sans-serif" font-weight="700" font-size="24" letter-spacing="6" fill="${BRAND_DARK}">CARNICERÍA</text>
</svg>`;

const ICONO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="96" fill="${BRAND}"/>
  <text x="256" y="320" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-weight="900" font-size="220" fill="#ffffff">LE</text>
  <rect x="126" y="370" width="260" height="26" fill="${ACCENT}"/>
</svg>`;

async function marca() {
  await mkdir(MARCA, { recursive: true });
  await writeFile(path.join(MARCA, 'logo.svg'), LOGO_SVG);
  await sharp(Buffer.from(LOGO_SVG)).png().toFile(path.join(MARCA, 'logo.png'));
  await writeFile(path.join(MARCA, 'icono.svg'), ICONO_SVG);
  const iconos = [
    ['favicon.png', 48],
    ['apple-touch.png', 180],
    ['icon-192.png', 192],
    ['icon-512.png', 512],
  ];
  for (const [nombre, lado] of iconos) {
    await sharp(Buffer.from(ICONO_SVG)).resize(lado, lado).png().toFile(path.join(MARCA, nombre));
  }
  console.log(`marca: logo e ${iconos.length} iconos`);
}

await productos();
await ilustraciones();
await carteles();
await marca();
