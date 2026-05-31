import { useRef, type ChangeEvent } from 'react';
import { useTheme } from '../../../../shared/theme/ThemeContext.js';

export function usePreferences() {
  const theme = useTheme();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleAddFont = () => fileInputRef.current?.click();

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const id = `custom-${Date.now()}`;
    const label = file.name.replace(/\.(ttf|otf|woff2?|eot)$/i, '');
    const fontFace = new FontFace(id, `url(${url})`);
    fontFace
      .load()
      .then((loaded) => {
        document.fonts.add(loaded);
        theme.addFont({ id, label, stack: `"${id}", system-ui, sans-serif` });
        theme.setFontFamily(id);
      })
      .catch(() => {});
    e.target.value = '';
  };

  return {
    fonts: theme.fonts,
    fontFamily: theme.fontFamily,
    setFontFamily: theme.setFontFamily,
    fontSize: theme.fontSize,
    setFontSize: theme.setFontSize,
    accentHex: theme.accentHex,
    setAccentHex: theme.setAccentHex,
    mode: theme.mode,
    setMode: theme.setMode,
    scale: theme.scale,
    fileInputRef,
    handleAddFont,
    handleFileChange
  };
}
