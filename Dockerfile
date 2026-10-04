# Build Stage: Run natively on host platform (fast, avoids QEMU emulation crashes)
FROM --platform=$BUILDPLATFORM node:22-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
RUN npm prune --omit=dev

# Production Stage: Node.js 22 (Serves SPA + /ha-proxy CORS proxy + PostgreSQL/Central Sync)
FROM node:22-alpine

WORKDIR /app

# Copy built frontend
COPY --from=builder /app/dist ./dist

# Copy production dependencies (pure JS runtime, avoids QEMU npm install crash on arm64)
COPY --from=builder /app/node_modules ./node_modules
COPY server.js package.json ./

# Create persistent storage directory
RUN mkdir -p /app/data

ENV NODE_ENV=production
ENV PORT=80
ENV DATA_DIR=/app/data

VOLUME ["/app/data"]

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/healthz || exit 1

CMD ["node", "server.js"]
