# --- build stage ---
FROM node:18-alpine AS builder
WORKDIR /usr/src/app

# Copy package manifest and tsconfigs
COPY package.json ./
COPY tsconfig.base.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy source and build
COPY src ./src
RUN npm run build

# --- runtime stage ---
FROM node:18-alpine AS runtime
WORKDIR /usr/src/app
ENV NODE_ENV=production

# Copy build artifacts and production modules
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/package.json ./

EXPOSE 3004
CMD ["node", "dist/index.js"] 