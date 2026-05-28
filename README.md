# Gestión de Proyectos

Semilla de arquitectura full-stack con **arquitectura hexagonal** (puertos y
adaptadores), lista para construir encima. Derivada y limpiada a partir de un
starter previo: solo conserva el esqueleto, la librería de componentes y un
módulo de ejemplo (`module-x`).

## Stack

| Capa     | Tecnologías                                        |
|----------|----------------------------------------------------|
| Backend  | Node · Express · Knex · SQL Server (tedious) · JWT |
| Frontend | React · Vite · TypeScript · Tailwind CSS           |

## Estructura

```
Gestion de proyectos/
  GestionProyectos-Backend/    API REST (hexagonal)
  GestionProyectos-Frontend/   SPA React (hexagonal)
```

Cada uno tiene su propio `README.md` con detalles.

## Puesta en marcha

```bash
# Backend
cd GestionProyectos-Backend
npm install
npm run db:test     # prueba la conexión a SQL Server
npm run dev         # :3001

# Frontend (en otra terminal)
cd GestionProyectos-Frontend
npm install
npm run dev         # :5173
```

## Estado de la semilla

- Sin migraciones ni seeds: las carpetas `database/migrations` y
  `database/seeds` están vacías. Defines el modelo de datos tú.
- Sin módulos de negocio: solo `module-x` como plantilla del patrón.
- Sin autenticación cableada: el shell del frontend es abierto; el
  middleware `auth` (JWT) queda listo para reutilizar cuando construyas el
  módulo de login.

## Requisitos de SQL Server (local)

- **TCP/IP habilitado** en la instancia (el driver `tedious` solo habla TCP).
- Base de datos **`GestionProyectos`** creada.
- Credenciales en `GestionProyectos-Backend/.env`.
