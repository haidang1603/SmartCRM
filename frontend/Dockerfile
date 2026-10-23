# ==============================================================================
# SmartCRM Frontend - Multi-stage Production Dockerfile
# Stage 1: Build React static assets with Vite
# Stage 2: Minimal Nginx Alpine Web Server
# ==============================================================================

# Stage 1: Build React static assets
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Hardened Nginx runtime
FROM nginx:alpine
WORKDIR /usr/share/nginx/html

# Clean default assets and copy production build
RUN rm -rf ./*
COPY --from=builder /app/dist .
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=15s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -q --spider http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
