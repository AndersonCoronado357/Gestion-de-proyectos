import Badge from './Badge.js';

export const meta = { id: 'badge', name: 'Badge (chip de estado)' };

export default function BadgePreview() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="neutral">Neutral</Badge>
        <Badge variant="primary">Primary</Badge>
        <Badge variant="success">Success</Badge>
        <Badge variant="warning">Warning</Badge>
        <Badge variant="danger">Danger</Badge>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="success" dot>Activo</Badge>
        <Badge variant="warning" dot>Pendiente</Badge>
        <Badge variant="danger" dot>Bloqueado</Badge>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Badge size="sm" variant="primary">Small</Badge>
        <Badge size="md" variant="primary">Medium</Badge>
      </div>
    </div>
  );
}
