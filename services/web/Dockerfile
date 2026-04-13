# --- Stage 1: Dependencies (Used for Production/Build only) ---
ARG NODE_VERSION=24.12.0-slim
FROM node:${NODE_VERSION} AS dependencies
WORKDIR /app
COPY --chown=node:node services/web/package.json services/web/package-lock.json* ./
RUN npm ci
USER node

# --- Stage 2: Development (WSL2 Optimized) ---
FROM node:${NODE_VERSION} AS development
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    gnupg \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*
RUN chown -R node:node /app
ENV NODE_ENV=development
EXPOSE 3000
USER node
CMD ["npm", "run", "dev"]

## --- Stage 3: Builder (Production Only) ---
FROM node:${NODE_VERSION} AS builder
WORKDIR /app
RUN chown node:node /app
COPY --from=dependencies --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node services/web/ . 
ENV NODE_ENV=production
ARG NEXT_PUBLIC_API_URL=https://localhost
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
USER node
RUN npm run build

# --- Stage 4: Runner (Production Only) ---
FROM node:${NODE_VERSION} AS runner
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* \
    && chown -R node:node /app
ENV NODE_ENV=production
COPY --from=builder --chown=node:node /app/.next ./.next
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/package.json ./package.json
COPY --from=builder --chown=node:node /app/public ./public
COPY --chown=node:node services/web/server.js ./server.js
USER node
CMD ["node", "server.js"]
