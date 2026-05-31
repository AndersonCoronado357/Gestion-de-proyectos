export interface CargoDef {
  id: string;
  label: string;
}

// Catálogo fijo de cargos. Sin selección por defecto en cada rol.
export const CARGOS: readonly CargoDef[] = [
  { id: 'medico-general', label: 'Médico general' },
  { id: 'medico-especialista', label: 'Médico especialista' },
  { id: 'cirujano', label: 'Cirujano' },
  { id: 'anestesiologo', label: 'Anestesiólogo' },
  { id: 'enfermeria', label: 'Enfermería' },
  { id: 'auxiliar-enfermeria', label: 'Auxiliar de enfermería' },
  { id: 'recepcion', label: 'Recepción' },
  { id: 'admision', label: 'Admisión' },
  { id: 'facturacion', label: 'Facturación' },
  { id: 'auditoria', label: 'Auditoría' },
  { id: 'farmaceutico', label: 'Farmacéutico' },
  { id: 'laboratorista', label: 'Laboratorista' },
  { id: 'tecnico-imagenes', label: 'Técnico de imágenes' },
  { id: 'paramedico', label: 'Paramédico' },
  { id: 'camillero', label: 'Camillero' },
  { id: 'director-medico', label: 'Director médico' },
  { id: 'coordinador-clinico', label: 'Coordinador clínico' },
  { id: 'administrador', label: 'Administrador del sistema' }
] as const;
