# Admin Service Dockerfile
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install pnpm
RUN corepack enable pnpm

# Copy root package files for workspace resolution
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared-lib/package.json ./packages/shared-lib/
COPY packages/monitoring/package.json ./packages/monitoring/

# Copy service-specific package.json
COPY services/admin-service/package.json ./services/admin-service/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Builder stage
FROM node:20-alpine AS builder
WORKDIR /app

# Install pnpm
RUN corepack enable pnpm

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages
COPY --from=deps /app/services/admin-service/node_modules ./services/admin-service/node_modules

# Copy workspace packages source
COPY packages/shared-lib ./packages/shared-lib
COPY packages/monitoring ./packages/monitoring

# Copy service source
COPY services/admin-service ./services/admin-service

# Build shared packages first
WORKDIR /app/packages/shared-lib
RUN pnpm run build

WORKDIR /app/packages/monitoring
RUN pnpm run build

# Build the service
WORKDIR /app/services/admin-service
RUN pnpm run build

# Runner stage
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodeuser

# Copy necessary files
COPY --from=builder --chown=nodeuser:nodejs /app/packages ./packages
COPY --from=builder --chown=nodeuser:nodejs /app/services/admin-service/dist ./dist
COPY --from=builder --chown=nodeuser:nodejs /app/services/admin-service/node_modules ./node_modules
COPY --from=builder --chown=nodeuser:nodejs /app/services/admin-service/package.json ./

USER nodeuser

EXPOSE 3009

CMD ["node", "dist/index.js"]