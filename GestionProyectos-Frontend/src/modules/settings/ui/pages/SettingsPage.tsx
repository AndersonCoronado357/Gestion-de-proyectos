import { cn } from '../../../../shared/lib/cn.js';
import { usePreferences } from '../hooks/usePreferences.js';
import FontFamilyList from '../components/FontFamilyList.jsx';
import FontSizeSelector from '../components/FontSizeSelector.jsx';
import ModeToggle from '../components/ModeToggle.jsx';
import ColorPicker from '../../../../shared/components/ColorPicker/index.js';
import { FolderPlusIcon } from '../../../../shared/components/icons/index.jsx';

interface CardProps {
  title: import('react').ReactNode;
  action?: import('react').ReactNode;
  children: import('react').ReactNode;
  className?: string;
}

function Card({ title, action, children, className }: CardProps) {
  return (
    <div
      className={cn(
        'flex flex-col overflow-hidden rounded-xl bg-bg p-4 shadow-sm',
        className
      )}
    >
      <div className="mb-3 flex shrink-0 items-center justify-between gap-2">
        <h3 className="text-[12.5px] font-medium text-fg">{title}</h3>
        {action}
      </div>
      <div className="flex min-h-0 flex-1 items-stretch">{children}</div>
    </div>
  );
}

export default function SettingsPage() {
  const {
    fonts,
    fontFamily,
    setFontFamily,
    fontSize,
    setFontSize,
    accentHex,
    setAccentHex,
    mode,
    setMode,
    scale,
    fileInputRef,
    handleAddFont,
    handleFileChange
  } = usePreferences();

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto overflow-x-hidden p-3 sm:p-4 md:flex-row md:overflow-hidden lg:p-8">
      <input
        ref={fileInputRef}
        type="file"
        accept=".ttf,.otf,.woff,.woff2"
        onChange={handleFileChange}
        className="hidden"
      />

      <Card
        title="Tipos de letra"
        className="w-full min-w-0 shrink-0 md:w-auto md:min-w-[280px] md:flex-[1]"
        action={
          <button
            type="button"
            onClick={handleAddFont}
            className={cn(
              'inline-flex h-7 items-center gap-1.5 rounded-md bg-primary px-2.5',
              'text-[12px] font-semibold text-on-primary outline-none transition-colors',
              'hover:bg-primary-700'
            )}
          >
            <FolderPlusIcon width={14} height={14} strokeWidth={2.5} />
            Agregar
          </button>
        }
      >
        <FontFamilyList
          fonts={fonts}
          value={fontFamily}
          onChange={setFontFamily}
        />
      </Card>

      <div className="flex w-full min-w-0 flex-col gap-4 md:flex-[2] md:overflow-hidden">
        <Card title="Color principal">
          <ColorPicker value={accentHex} onChange={setAccentHex} />
        </Card>

        <Card title="Tamaño de letra">
          <FontSizeSelector value={fontSize} onChange={setFontSize} />
        </Card>

        <Card title="Modo">
          <ModeToggle
            value={mode}
            onChange={setMode}
            scale={scale}
            accentHex={accentHex}
          />
        </Card>
      </div>
    </div>
  );
}
