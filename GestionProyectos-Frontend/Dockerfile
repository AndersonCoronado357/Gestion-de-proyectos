# Generado por acmsy — frontend Gestión de Proyectos (React/Vite → estático, nginx)
FROM node:22-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --legacy-peer-deps
COPY . .
# Variables de build de Vite (NO son secretos): URL pública del backend y el
# Client ID público de Google. Vite las hornea en el bundle al compilar.
ENV VITE_API_BASE_URL=https://api-gestion.acmsy.com/api
ENV VITE_GOOGLE_CLIENT_ID=936397686328-k738c6pc5bn7qtrsb218h5ensp0qfu6k.apps.googleusercontent.com
RUN npm run build

FROM nginx:alpine AS run
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
