# ============================================================================
# DOKPLOY DEPLOYMENT - NOTIFICATIONS WORKER
# ============================================================================
FROM node:24-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@10.27.0

# Copy workspace configuration
COPY package.json pnpm-workspace.yaml .npmrc ./
# If lockfile exists, copy it (it will exist after we run pnpm install)
COPY pnpm-lock.yaml* ./

# Copy packages package.jsons (simplistic approach for now)
COPY packages/expo-worker/package.json ./packages/expo-worker/
COPY packages/fcm-worker/package.json ./packages/fcm-worker/

# Authentication for Private Registry
ARG NPM_TOKEN
ENV NPM_TOKEN=$NPM_TOKEN
ENV GITHUB_TOKEN=$NPM_TOKEN

# Install dependencies
RUN pnpm install --frozen-lockfile

# Rebuilder stage (if we add TS later, for now just copying)
FROM base AS builder
WORKDIR /app
ARG NPM_TOKEN
ENV NPM_TOKEN=$NPM_TOKEN

RUN npm install -g pnpm@10.27.0

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build if necessary (currently no build script in workers, but good hook)
# RUN pnpm --filter expo-worker... build

# Runner stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy everything necessary
COPY --from=builder /app .

# Set User
USER nextjs

# Default CMD - should be overridden by docker-compose or k8s
CMD ["node", "packages/expo-worker/src/index.js"]
