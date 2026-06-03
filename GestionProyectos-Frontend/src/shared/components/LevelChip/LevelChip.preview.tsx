import LevelChip from './LevelChip.js';

export const meta = { id: 'level-chip', name: 'LevelChip (severidad)' };

export default function LevelChipPreview() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <LevelChip level="error" />
        <LevelChip level="warn" />
        <LevelChip level="info" />
        <LevelChip level="debug" />
        <LevelChip level="audit" />
        <LevelChip level="success" />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <LevelChip level="error" dot={false} />
        <LevelChip level="warn" dot={false} />
        <LevelChip level="info" dot={false} />
      </div>
    </div>
  );
}
