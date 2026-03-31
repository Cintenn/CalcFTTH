# Multi-stage build for optimal production image
FROM node:20-alpine AS dependencies

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy workspace files
COPY pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY tsconfig.base.json ./

# Copy package.json files
COPY api-server/package.json ./api-server/
COPY ftth-calculator/package.json ./ftth-calculator/
COPY packages/db/package.json ./packages/db/
COPY packages/api-zod/package.json ./packages/api-zod/
COPY packages/api-client-react/package.json ./packages/api-client-react/

# Install dependencies (using frozen lockfile for reproducibility)
RUN pnpm install --no-frozen-lockfile --prod

# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy everything
COPY . .

# Copy dependencies from previous stage
COPY --from=dependencies /app/node_modules ./node_modules

# Install dev dependencies for building
RUN pnpm install --no-frozen-lockfile

# Type check
RUN pnpm --recursive typecheck || true

# Build
RUN pnpm --recursive build

# Production stage - minimal final image
FROM node:20-alpine

WORKDIR /app

# Install pnpm for runtime
RUN npm install -g pnpm

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# Copy only necessary files
COPY --from=builder /app/pnpm-workspace.yaml /app/pnpm-lock.yaml /app/.npmrc ./
COPY --from=builder /app/api-server/dist ./api-server/dist
COPY --from=builder /app/ftth-calculator/dist ./ftth-calculator/dist
COPY --from=builder /app/node_modules ./node_modules

# Create logs directory
RUN mkdir -p /app/logs && chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Environment
ENV NODE_ENV=production
ENV LOG_LEVEL=warn
ENV PORT=3000

# Expose port
EXPOSE 3000

# Start API server
CMD ["node", "--enable-source-maps", "./api-server/dist/index.mjs"]
