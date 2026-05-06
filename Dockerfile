# syntax=docker/dockerfile:1

FROM node:22-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS build
WORKDIR /app

ARG VITE_STRIPE_PUBLISHABLE=""

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN VITE_STRIPE_PUBLISHABLE_KEY="$VITE_STRIPE_PUBLISHABLE" npm run build

FROM nginx:1.27-alpine AS runtime

ENV API_UPSTREAM=https://api.e-mall.store

COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1
