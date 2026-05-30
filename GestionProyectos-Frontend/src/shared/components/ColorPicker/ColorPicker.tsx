import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../lib/cn.js';
import { useCloseOnScroll } from '../../lib/useCloseOnScroll.js';
import {
  SCALE_KEYS,
  generateScaleFromHex,
  isValidHex,
  normalizeHex,
  type Rgb
} from '../../lib/colorScale.js';

interface Hsv {
  h: number;
  s: number;
  v: number;
}

function hexToRgb(hex: string): Rgb {
  const c = hex.replace('#', '');
  return {
    r: parseInt(c.slice(0, 2), 16),
    g: parseInt(c.slice(2, 4), 16),
    b: parseInt(c.slice(4, 6), 16)
  };
}
function rgbToHex({ r, g, b }: Rgb): string {
  const t = (v: number) =>
    Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return `#${t(r)}${t(g)}${t(b)}`;
}
function rgbToHsv({ r, g, b }: Rgb): Hsv {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
  }
  h *= 60;
  if (h < 0) h += 360;
  return { h, s: max === 0 ? 0 : (d / max) * 100, v: max * 100 };
}
function hsvToRgb({ h, s, v }: Hsv): Rgb {
  s /= 100;
  v /= 100;
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r = 0;
  let g = 0;
  let b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return { r: (r + m) * 255, g: (g + m) * 255, b: (b + m) * 255 };
}
const hexToHsv = (hex: string): Hsv => rgbToHsv(hexToRgb(hex));
const hsvToHex = (hsv: Hsv): string => rgbToHex(hsvToRgb(hsv));

interface SaturationAreaProps {
  hsv: Hsv;
  onChange: (next: Hsv) => void;
}

function SaturationArea({ hsv, onChange }: SaturationAreaProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [dragging, setDragging] = useState(false);

  const move = (e: MouseEvent | globalThis.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
    onChange({ ...hsv, s: (x / rect.width) * 100, v: 100 - (y / rect.height) * 100 });
  };

  useEffect(() => {
    if (!dragging) return;
    const up = () => setDragging(false);
    const onMove = (e: globalThis.MouseEvent) => move(e);
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', up);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', up);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragging, hsv]);

  const pureHue = hsvToHex({ h: hsv.h, s: 100, v: 100 });

  return (
    <div
      ref={ref}
      onMouseDown={(e) => {
        setDragging(true);
        move(e);
      }}
      className="relative h-36 w-full cursor-crosshair overflow-hidden rounded-md"
      style={{ backgroundColor: pureHue }}
    >
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(to right, white, transparent)' }}
      />
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(to top, black, transparent)' }}
      />
      <div
        className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow"
        style={{
          left: `${hsv.s}%`,
          top: `${100 - hsv.v}%`,
          backgroundColor: hsvToHex(hsv)
        }}
      />
    </div>
  );
}

interface HueSliderProps {
  hue: number;
  onChange: (hue: number) => void;
}

function HueSlider({ hue, onChange }: HueSliderProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [dragging, setDragging] = useState(false);

  const move = (e: MouseEvent | globalThis.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    onChange((x / rect.width) * 360);
  };

  useEffect(() => {
    if (!dragging) return;
    const up = () => setDragging(false);
    const onMove = (e: globalThis.MouseEvent) => move(e);
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', up);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', up);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragging]);

  return (
    <div
      ref={ref}
      onMouseDown={(e) => {
        setDragging(true);
        move(e);
      }}
      className="relative mt-3 h-3 w-full cursor-pointer rounded-full"
      style={{
        background:
          'linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)'
      }}
    >
      <div
        className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow"
        style={{
          left: `${(hue / 360) * 100}%`,
          backgroundColor: hsvToHex({ h: hue, s: 100, v: 100 })
        }}
      />
    </div>
  );
}

interface PopupPosition {
  top?: number;
  bottom?: number;
  left: number;
  maxHeight?: number;
}

export interface ColorPickerProps {
  value?: string;
  onChange?: (hex: string) => void;
  showScale?: boolean;
  className?: string;
}

export default function ColorPicker({
  value = '#295072',
  onChange,
  showScale = true,
  className
}: ColorPickerProps) {
  const current = normalizeHex(value);
  const [text, setText] = useState(current.replace('#', '').toUpperCase());
  const [open, setOpen] = useState(false);
  const [hsv, setHsv] = useState<Hsv>(() => hexToHsv(current));
  const [popupPos, setPopupPos] = useState<PopupPosition>({ top: 0, left: 0 });
  const swatchRef = useRef<HTMLButtonElement | null>(null);
  const popupRef = useRef<HTMLDivElement | null>(null);

  useCloseOnScroll(open, () => setOpen(false), [popupRef]);

  useEffect(() => {
    setText(current.replace('#', '').toUpperCase());
    if (!open) setHsv(hexToHsv(current));
  }, [current, open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: globalThis.MouseEvent) => {
      const target = e.target as Node | null;
      if (popupRef.current && target && popupRef.current.contains(target)) return;
      if (swatchRef.current && target && swatchRef.current.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const togglePopup = () => {
    if (!open && swatchRef.current) {
      const rect = swatchRef.current.getBoundingClientRect();
      const popupWidth = 260;
      const popupHeight = 360;
      const margin = 8;

      const left = Math.min(rect.left, window.innerWidth - popupWidth - 16);

      const HEADER_H = 60;
      const spaceBelow = window.innerHeight - rect.bottom - margin;
      const spaceAbove = rect.top - margin - HEADER_H;

      if (spaceBelow >= popupHeight || spaceBelow >= spaceAbove) {
        setPopupPos({ top: rect.bottom + margin, bottom: undefined, left });
      } else {
        setPopupPos({
          top: undefined,
          bottom: window.innerHeight - rect.top + margin,
          left,
          maxHeight: spaceAbove
        });
      }
    }
    setOpen((v) => !v);
  };

  const commit = (raw: string) => {
    const v = raw.startsWith('#') ? raw : `#${raw}`;
    if (isValidHex(v)) onChange?.(v.toLowerCase());
  };

  const handleHsvChange = (newHsv: Hsv) => {
    setHsv(newHsv);
    onChange?.(hsvToHex(newHsv).toLowerCase());
  };

  const scale = isValidHex(current) ? generateScaleFromHex(current) : null;

  return (
    <div className={cn('flex w-full flex-col gap-3', className)}>
      <div className="flex items-stretch gap-2">
        <button
          ref={swatchRef}
          type="button"
          onClick={togglePopup}
          className="h-10 w-12 rounded-lg border border-border shadow-inner outline-none"
          style={{ backgroundColor: current }}
          aria-label="Abrir selector de color"
        />
        <div className="flex h-10 flex-1 items-center rounded-lg border border-border bg-bg pl-3 pr-2">
          <span className="text-[12px] font-medium text-fg-faint">#</span>
          <input
            type="text"
            value={text}
            onChange={(e) => {
              const v = e.target.value.replace('#', '').slice(0, 6);
              setText(v);
              if (v.length === 6) commit(v);
            }}
            onBlur={() => setText(current.replace('#', '').toUpperCase())}
            spellCheck={false}
            maxLength={6}
            className="ml-1 h-full w-full bg-transparent font-mono text-[12.5px] uppercase tracking-wider text-fg outline-none"
          />
        </div>
      </div>

      {showScale && scale && (
        <div className="grid w-full grid-cols-10 gap-1">
          {SCALE_KEYS.map((k) => (
            <span
              key={k}
              title={`${k}: ${scale[k]}`}
              style={{ backgroundColor: scale[k] }}
              className="h-9 w-full rounded-md border border-black/[0.04]"
            />
          ))}
        </div>
      )}

      {open &&
        createPortal(
          <div
            ref={popupRef}
            style={{
              top: popupPos.top,
              bottom: popupPos.bottom,
              left: popupPos.left,
              maxHeight: popupPos.maxHeight,
              overflowY: popupPos.maxHeight ? 'auto' : undefined
            }}
            className="fixed z-[1000] w-64 rounded-xl border border-border bg-bg p-3 shadow-xl"
          >
            <SaturationArea hsv={hsv} onChange={handleHsvChange} />
            <HueSlider hue={hsv.h} onChange={(h) => handleHsvChange({ ...hsv, h })} />
            <div className="mt-3 flex items-center gap-2 rounded-md border border-border bg-bg px-2.5 py-1.5">
              <span className="text-[11.5px] font-medium text-fg-faint">#</span>
              <input
                type="text"
                value={current.replace('#', '').toUpperCase()}
                onChange={(e) => {
                  const v = e.target.value.replace('#', '').slice(0, 6);
                  if (v.length === 6) commit(v);
                }}
                spellCheck={false}
                maxLength={6}
                className="w-full bg-transparent font-mono text-[12px] uppercase tracking-wider text-fg outline-none"
              />
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
