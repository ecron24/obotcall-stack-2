# ===================================
# 🏢 Dockerfile pour Immo API
# Hono REST API - Backend pour Immo App
# ===================================

# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app

# Copier les fichiers de dépendances
COPY package.json package-lock.json* ./
RUN npm ci

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Copier les dépendances depuis deps
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build du projet TypeScript
RUN npm run build

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production

# Créer un utilisateur non-root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 hono

# Copier les fichiers nécessaires
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Changer les permissions
RUN chown -R hono:nodejs /app

USER hono

EXPOSE 3012

ENV PORT 3012

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3012/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "dist/index.js"]
