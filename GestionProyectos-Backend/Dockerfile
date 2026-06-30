# Generado por acmsy — backend Gestión de Proyectos (Node/Express/Knex/SQL Server)
# Multi-stage: compila TypeScript en `build`, corre solo con deps de producción.
FROM node:22-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --legacy-peer-deps
COPY . .
RUN npm run build

# Imagen COMPLETA (no -slim): ya incluye git, así evitamos `apt-get` en el build
# (que en este WSL de 5GB reventaba la VM). git lo usa el generador de módulos
# en prod para clonar/commitear/pushear.
FROM node:22 AS run
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001
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
