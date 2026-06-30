# Generado por acmsy — backend Gestión de Proyectos (Node/Express/Knex/SQL Server)
# Multi-stage: compila TypeScript en `build`, corre solo con deps de producción.
FROM node:22-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --legacy-peer-deps
COPY . .
RUN npm run build

FROM node:22-slim AS run
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001
# git: necesario para el generador de módulos en prod (clona/commitea/pushea).
RUN apt-get update && apt-get install -y --no-install-recommends git ca-certificates \
  && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
RUN npm ci --omit=dev --legacy-peer-deps && npm cache clean --force
COPY --from=build /app/dist ./dist
COPY knexfile.prod.cjs ./knexfile.prod.cjs
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x docker-entrypoint.sh
EXPOSE 3001
# Corre migraciones pendientes (best-effort) y arranca. Así, tras generar un
# módulo y reconstruir, su tabla se crea sola al arrancar el contenedor.
CMD ["./docker-entrypoint.sh"]
