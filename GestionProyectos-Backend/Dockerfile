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
COPY package*.json ./
RUN npm ci --omit=dev --legacy-peer-deps && npm cache clean --force
COPY --from=build /app/dist ./dist
COPY knexfile.prod.cjs ./knexfile.prod.cjs
EXPOSE 3001
# Las migraciones se corren aparte (knex migrate:latest --knexfile knexfile.prod.cjs).
CMD ["node", "dist/server.js"]
