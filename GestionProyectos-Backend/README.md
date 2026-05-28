# GestionProyectos-Backend

Hexagonal architecture starter (Node + Express + Knex + SQL Server).

## Quickstart

1. Edita `.env` con tus credenciales de SQL Server (host, user, password, db).
2. `npm install`
3. `npm run db:test`     # prueba la conexion
4. `npm run db:migrate`  # corre migraciones
5. `npm run db:seed`     # corre seeds
6. `npm run dev`         # arranca el servidor (default :3000)

## Scripts de base de datos

| Comando                              | Descripcion                                    |
|--------------------------------------|------------------------------------------------|
| `npm run db:test`                    | Prueba la conexion contra SQL Server           |
| `npm run db:migrate`                 | Aplica migraciones pendientes                  |
| `npm run db:migrate:rollback`        | Revierte el ultimo batch                       |
| `npm run db:migrate:status`          | Muestra estado de migraciones                  |
| `npm run db:migrate:make NOMBRE`     | Crea nueva migracion en src/database/migrations|
| `npm run db:seed`                    | Corre todos los seeds                          |
| `npm run db:seed:make NOMBRE`        | Crea nuevo seed en src/database/seeds          |

## Endpoints iniciales

- `GET  /health`          health check
- `POST /api/auth/login`  body: `{ "username": "admin", "password": "admin" }`
- `GET  /api/module-x`    listado paginado (publico)
- `POST /api/module-x`    crear (requiere Bearer token)
