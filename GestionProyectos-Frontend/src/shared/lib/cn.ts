export type ClassValue =
  | string
  | number
  | null
  | undefined
  | false
  | ClassValue[]
  | Record<string, unknown>;

export function cn(...inputs: ClassValue[]): string {
  const out: Array<string | number> = [];
  for (const v of inputs) {
    if (!v) continue;
    if (typeof v === 'string' || typeof v === 'number') {
      out.push(v);
    } else if (Array.isArray(v)) {
      const r = cn(...v);
      if (r) out.push(r);
    } else if (typeof v === 'object') {
      for (const key in v) {
        if ((v as Record<string, unknown>)[key]) out.push(key);
      }
    }
  }
  return out.join(' ');
}
