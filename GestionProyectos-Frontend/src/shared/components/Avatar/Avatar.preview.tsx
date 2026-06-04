import Avatar from './Avatar.js';

export const meta = { id: 'avatar', name: 'Avatar (foto / iniciales)' };

export default function AvatarPreview() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Avatar name="Ana García" size="xs" />
        <Avatar name="Bruno López" size="sm" />
        <Avatar name="Camila Pérez" size="md" />
        <Avatar name="Diego Salas" size="lg" />
      </div>
      <div className="flex items-center gap-3">
        <Avatar src="https://i.pravatar.cc/64?img=12" size="md" />
        <Avatar src="https://i.pravatar.cc/64?img=33" size="md" />
        <Avatar name="Sin avatar" size="md" />
      </div>
    </div>
  );
}
