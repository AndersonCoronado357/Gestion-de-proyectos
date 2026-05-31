// Normaliza un SVG pegado por el usuario:
//  1. Quita scripts y atributos `on*` (XSS).
//  2. Reemplaza cualquier color (fill/stroke con valor distinto de "none")
//     por `currentColor`, así el icono adopta el color del contexto.
//  3. Quita width/height del <svg> raíz para que el contenedor controle el
//     tamaño vía CSS — el SVG llena 100% de su caja.
export function normalizeSvg(raw) {
  if (!raw) return null;
  let s = String(raw)
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/\son\w+\s*=\s*"[^"]*"/gi, '')
    .replace(/\son\w+\s*=\s*'[^']*'/gi, '');

  s = s
    .replace(/fill\s*=\s*"(?!\s*none\b)[^"]*"/gi, 'fill="currentColor"')
    .replace(/fill\s*=\s*'(?!\s*none\b)[^']*'/gi, "fill='currentColor'")
    .replace(/stroke\s*=\s*"(?!\s*none\b)[^"]*"/gi, 'stroke="currentColor"')
    .replace(/stroke\s*=\s*'(?!\s*none\b)[^']*'/gi, "stroke='currentColor'")
    .replace(/fill\s*:\s*(?!\s*none\b)[^;"']+/gi, 'fill:currentColor')
    .replace(/stroke\s*:\s*(?!\s*none\b)[^;"']+/gi, 'stroke:currentColor');

  s = s.replace(/<svg\b([^>]*)>/i, (_, attrs) => {
    const cleaned = attrs
      .replace(/\s(width|height)\s*=\s*"[^"]*"/gi, '')
      .replace(/\s(width|height)\s*=\s*'[^']*'/gi, '');
    return `<svg${cleaned} width="100%" height="100%">`;
  });

  return s.trim();
}

export function isLikelySvg(text) {
  return /<svg\b/i.test(String(text || ''));
}
