# Build Stage
FROM node:22-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Production Stage: Ultra-lightweight Node.js 22 (Serves SPA + /ha-proxy CORS proxy)
FROM node:22-alpine

WORKDIR /app

# Copy built frontend and production server
COPY --from=builder /app/dist ./dist
COPY server.js package.json ./

ENV NODE_ENV=production
ENV PORT=80

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/healthz || exit 1

CMD ["node", "server.js"]
