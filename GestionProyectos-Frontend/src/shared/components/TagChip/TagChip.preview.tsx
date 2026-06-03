import TagChip from './TagChip.js';

export const meta = { id: 'tag-chip', name: 'TagChip (taxonomía)' };

export default function TagChipPreview() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <TagChip>frontend</TagChip>
        <TagChip>backend</TagChip>
        <TagChip>integraciones</TagChip>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <TagChip uppercase>http</TagChip>
        <TagChip uppercase>exception</TagChip>
        <TagChip uppercase>audit</TagChip>
        <TagChip uppercase>console</TagChip>
      </div>
    </div>
  );
}
