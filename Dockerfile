# Multi-stage build for production optimization
FROM node:20-alpine AS base

# Install system dependencies
RUN apk add --no-cache \
    openssl \
    ca-certificates \
    dumb-init

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY pnpm-lock.yaml* ./

# Development stage
FROM base AS development
RUN npm install -g pnpm
RUN pnpm install
COPY . .
RUN npx prisma generate
EXPOSE 3000
CMD ["pnpm", "dev"]

# Build stage
FROM base AS build
RUN npm install -g pnpm
RUN pnpm install
COPY . .
RUN npx prisma generate
RUN pnpm build

# Production stage
FROM base AS production
RUN npm install -g pnpm

# Install only production dependencies
RUN pnpm install --prod --frozen-lockfile

# Copy built application and prisma
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY healthcheck.js ./

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S appuser -u 1001 -G nodejs

# Change ownership of the app directory
RUN chown -R appuser:nodejs /app
USER appuser

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node healthcheck.js

# Start the application with dumb-init for proper signal handling
CMD ["dumb-init", "node", "dist/app.js"]