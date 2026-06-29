# Generado por acmsy — frontend Gestión de Proyectos (React/Vite → estático, nginx)
FROM node:22-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --legacy-peer-deps
COPY . .
# Variables de build de Vite (NO son secretos): URL pública del backend y el
# Client ID público de Google. Vite las hornea en el bundle al compilar.
ENV VITE_API_BASE_URL=https://api-gestion.acmsy.com/api
# Login con Google: cliente COMPARTIDO de acmsy (el mismo que Drestyl/landing) +
# callback de redirección. Se registra https://gestion.acmsy.com/auth/callback
# en ese cliente de Google.
ENV VITE_GOOGLE_CLIENT_ID=487360576094-k5usrjm1b699kgv1nu3lat4ev0kpe8v8.apps.googleusercontent.com
ENV VITE_GOOGLE_REDIRECT_URI=https://gestion.acmsy.com/auth/callback
RUN npm run build

FROM nginx:alpine AS run
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
