# =============================================================================
# ERPX Frontend — Dockerfile
# Multi-stage: development → build → production
# =============================================================================

# ---------------------------------------------------------------------------
# Stage 1 — Development (Vite HMR dev server)
# ---------------------------------------------------------------------------
FROM node:20-alpine AS development

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 3001

ENV NODE_ENV=development

CMD ["npm", "run", "dev"]

# ---------------------------------------------------------------------------
# Stage 2 — Build (production SSR bundle via Nitro)
# ---------------------------------------------------------------------------
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ARG VITE_API_URL=http://localhost:3001/api/v1
ENV VITE_API_URL=$VITE_API_URL

ENV NITRO_PRESET=node-server

RUN npm run build

# ---------------------------------------------------------------------------
# Stage 3 — Production (Nitro SSR server)
# ---------------------------------------------------------------------------
FROM node:20-alpine AS production

WORKDIR /app

COPY --from=build /app/.output ./.output
COPY --from=build /app/package.json ./package.json

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

ENV NODE_ENV=production

CMD ["node", ".output/server/index.mjs"]
