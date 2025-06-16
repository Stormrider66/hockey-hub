# --- build stage ---
FROM node:18-alpine AS builder
WORKDIR /usr/src/app

# Copy package manifests and install dependencies
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy source and build
COPY . .
RUN npm run build

# --- runtime stage ---
FROM node:18-alpine AS runtime
WORKDIR /usr/src/app
ENV NODE_ENV=production

# Copy built artifacts and production dependencies only
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/package.json ./

EXPOSE 3001
CMD ["node", "dist/index.js"]