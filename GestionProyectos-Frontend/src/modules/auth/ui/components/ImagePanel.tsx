import { useEffect, useState } from 'react';
import LoginPanel, { type LoginSlide } from './LoginPanel.js';

// Panel del login: trae el contenido editable del backend (GET público
// /api/login-content, configurable desde Administración → "Contenido del
// login") y lo pinta con <LoginPanel>. Fallback a defaults si no hay red.

const DEFAULT_SLIDES: LoginSlide[] = [
  {
    title: 'Todos tus proyectos, en un solo lugar.',
    text: 'Centraliza cada iniciativa con su responsable, centro y área, y velas avanzar en tiempo real.'
  },
  {
    title: 'El avance, siempre al día.',
    text: 'Registra el estado y el porcentaje de cada proyecto, y conserva la historia de su evolución.'
  },
  {
    title: 'Que nada se quede pendiente.',
    text: 'Organiza las tareas por responsable y ten siempre claro qué falta por hacer.'
  },
  {
    title: 'Mide lo que de verdad importa.',
    text: 'Costo, ahorro anual y porcentaje de avance de cada iniciativa, de un vistazo.'
  }
];

export default function ImagePanel() {
  const [slides, setSlides] = useState<LoginSlide[]>(DEFAULT_SLIDES);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/login-content')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled && d && Array.isArray(d.slides) && d.slides.length > 0) {
          setSlides(d.slides);
        }
      })
      .catch(() => {
        /* sin red → defaults */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return <LoginPanel slides={slides} />;
}
