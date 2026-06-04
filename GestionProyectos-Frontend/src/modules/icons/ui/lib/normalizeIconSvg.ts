// Normaliza un SVG para que herede el color del tema (currentColor) cuando
// es monocromático. Si el SVG ya usa currentColor o trae múltiples colores
// distintos (logos como GoogleIcon), lo deja intacto.
//
// Para SVG monocromáticos: reemplaza `fill="#xxxxxx"`, `stroke="#xxxxxx"`,
// `fill="rgb(...)"` y `stroke="rgb(...)"` por `currentColor` — así heredan
// del wrapper (text-fg-muted, sidebar text, etc.).

const COLOR_RE = /(fill|stroke)\s*=\s*"(#[0-9a-fA-F]{3,8}|rgb\([^)]+\)|rgba\([^)]+\))"/g;

function collectColors(svg: string): Set<string> {
  const colors = new Set<string>();
  let m: RegExpExecArray | null;
  const re = new RegExp(COLOR_RE);
  while ((m = re.exec(svg)) !== null) {
    const v = m[2]!.toLowerCase();
    if (v === '#000' || v === '#000000' || v === 'rgb(0,0,0)' || v === 'rgb(0, 0, 0)')
      continue; // tratamos "negro" como neutro y dejamos pasar el resto
    colors.add(v);
  }
  return colors;
}

export function normalizeIconSvg(svg: string): string {
  if (!svg) return svg;
  // Si ya usa currentColor, nada que hacer.
  if (/(?:fill|stroke)\s*=\s*"currentColor"/i.test(svg)) {
    // Aún así reemplazamos posibles colores hardcoded sueltos si son
    // monocromáticos y consistentes con currentColor.
    const colors = collectColors(svg);
    if (colors.size === 0) return svg;
    if (colors.size === 1) {
      return svg.replace(COLOR_RE, (_m, attr) => `${attr}="currentColor"`);
    }
    return svg; // multi-color → no tocar
  }

  const colors = collectColors(svg);
  if (colors.size <= 1) {
    // Monocromático (1 color o ninguno explícito) → todo a currentColor.
    return svg.replace(COLOR_RE, (_m, attr) => `${attr}="currentColor"`);
  }
  // Multi-color (logos como Google) → respetar los fills.
  return svg;
}
