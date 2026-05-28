# GestionProyectos-Frontend

React + Vite + Tailwind starter (estructura hexagonal).

## Quickstart

1. `npm install`
2. `npm run dev`     # http://localhost:5173

El proxy de Vite redirige `/api/*` a `http://localhost:3000`, asi que el frontend
puede llamar a `fetch("/api/...")` sin preocuparse por CORS en dev.

## Tailwind

Ya esta configurado (`tailwind.config.js` + `postcss.config.js` + directivas en `src/index.css`).
