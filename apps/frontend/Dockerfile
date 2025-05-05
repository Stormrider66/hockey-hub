# --- build stage ---
FROM node:18-alpine AS builder
WORKDIR /app

# Install dependencies
COPY package*.json .
RUN npm install --legacy-peer-deps

# Copy source and build
COPY . .
RUN npm run build

# --- runtime stage ---
FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=80

# Copy build output and production dependencies
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

EXPOSE 80
CMD ["npm", "start"] 