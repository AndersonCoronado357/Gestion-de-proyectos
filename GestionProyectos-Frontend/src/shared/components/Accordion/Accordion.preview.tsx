import Accordion from './Accordion.js';

export const meta = { id: 'accordion', name: 'Accordion (secciones colapsables)' };

const ITEMS = [
  {
    id: 'q1',
    title: '¿Cómo cambio mi contraseña?',
    content: (
      <p className="text-[12.5px] text-fg-muted">
        Entrá a Configuración → Seguridad y elegí "Cambiar contraseña". Necesitás la
        contraseña actual para confirmar.
      </p>
    )
  },
  {
    id: 'q2',
    title: '¿Puedo tener varios usuarios SAP?',
    content: (
      <p className="text-[12.5px] text-fg-muted">
        Sólo uno por cuenta. Si necesitás migrar a otro, contactá al administrador.
      </p>
    )
  },
  {
    id: 'q3',
    title: '¿Cómo recupero un proyecto archivado?',
    content: (
      <p className="text-[12.5px] text-fg-muted">
        Desde la lista de proyectos, abrí el filtro "Archivados" y elegí "Restaurar"
        en el menú contextual.
      </p>
    )
  }
];

export default function AccordionPreview() {
  return <Accordion items={ITEMS} defaultOpen={['q1']} />;
}
