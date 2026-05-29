// Item de catálogo "service" — funcionalmente: cargo.

export interface ServiceItem {
  id: number;
  code: string;
  description: string;
  healthCenter: string | null;
}
