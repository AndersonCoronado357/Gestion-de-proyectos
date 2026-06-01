// Renderiza un icono de la BIBLIOTECA DE LA BASE DE DATOS por su nombre.
// El SVG usa currentColor (toma el color del texto) y se dimensiona con
// width/height — el <svg> interno llena el contenedor. Mientras no haya
// cargado (o no exista), deja un hueco del tamaño correcto (sin salto).

import type { CSSProperties, SVGProps } from 'react';
import { cn } from '../lib/cn.js';
import { useIconSvg } from './IconsContext.js';

export type IconProps = SVGProps<SVGSVGElement>;
export interface IconComponentProps extends IconProps {
  name: string;
}

export default function Icon({
  name,
  width = 16,
  height = 16,
  className,
  style
}: IconComponentProps) {
  const svg = useIconSvg(name);
  const dims: CSSProperties = {
    width: width as CSSProperties['width'],
    height: height as CSSProperties['height'],
    lineHeight: 0,
    ...(style as CSSProperties)
  };
  return (
    <span
      aria-hidden="true"
      data-icon={name}
      className={cn(
        'inline-flex shrink-0 items-center justify-center [&>svg]:h-full [&>svg]:w-full',
        className
      )}
      style={dims}
      {...(svg ? { dangerouslySetInnerHTML: { __html: svg } } : {})}
    />
  );
}
