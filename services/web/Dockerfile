# --- Stage 1: Dependencies (Used for Production/Build only) ---
ARG NODE_VERSION=24.12.0-slim
FROM node:${NODE_VERSION} AS dependencies
WORKDIR /app
COPY services/web/package.json services/web/package-lock.json* ./
RUN npm ci

# --- Stage 2: Development (WSL2 Optimized) ---
FROM node:${NODE_VERSION} AS development
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    gnupg \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=development
EXPOSE 3000
CMD ["npm", "run", "dev"]

## --- Stage 3: Builder (Production Only) ---
FROM node:${NODE_VERSION} AS builder
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY services/web/ . 
ENV NODE_ENV=production
ARG NEXT_PUBLIC_API_URL=https://localhost
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
RUN npm run build

# --- Stage 4: Runner (Production Only) ---
FROM node:${NODE_VERSION} AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public ./public
COPY services/web/server.js ./server.js
CMD ["node", "server.js"]