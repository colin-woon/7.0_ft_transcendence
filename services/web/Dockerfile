# --- Stage 1: Dependencies (Used for Production/Build only) ---
ARG NODE_VERSION=24.12.0-slim
FROM node:${NODE_VERSION} AS dependencies
WORKDIR /app
COPY services/web/package.json services/web/package-lock.json* ./
RUN npm ci

# --- Stage 2: Development (WSL2 Optimized) ---
FROM node:${NODE_VERSION} AS development
WORKDIR /app
ENV NODE_ENV=development
EXPOSE 3000
CMD ["npm", "run", "dev"]

## --- Stage 3: Builder (Production Only) ---
FROM node:${NODE_VERSION} AS builder
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY services/web/ . 
ENV NODE_ENV=production
RUN npm run build

# --- Stage 4: Runner (Production Only) ---
FROM node:${NODE_VERSION} AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
CMD ["node", "server.js"]