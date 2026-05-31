// Vista de inicio. No es un módulo de la tabla `modules` — es la
// "landing" interna de la app, fija en el sidebar como primer ítem.
//
// De momento queda vacía a propósito (el contenido lo definimos más
// adelante).

export default function HomePage() {
  return (
    <div className="flex h-full items-center justify-center p-8">
      <p className="text-[13px] text-fg-faint">Inicio</p>
    </div>
  );
}
