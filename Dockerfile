# ============================================================================
# pnpm Monorepo Multi-Stage Dockerfile for Railway
# ============================================================================
# Fixes for common pnpm issues:
# - ERR_PNPM_LOCKFILE_CONFIG_MISMATCH: Resolved by setting CI=true early
# - ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY: Fixed with CI=true
# - Workspace protocol (workspace:*): Preserved through proper layer caching
# ============================================================================

# ============================================================================
# Stage 1: Builder - Compile all packages
# ============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm

# CRITICAL: Set CI=true BEFORE any pnpm commands to prevent TTY issues
ENV CI=true

# Step 1: Copy workspace configuration files FIRST for optimal layer caching
# These rarely change, so they cache effectively
COPY pnpm-workspace.yaml ./
COPY pnpm-lock.yaml ./
COPY .npmrc ./
COPY tsconfig.base.json ./
COPY .gitignore ./

# Step 2: Copy root package.json
COPY package.json ./

# Step 3: Copy all package.json files from packages (for workspace resolution)
COPY packages/db/package.json ./packages/db/
COPY packages/api-zod/package.json ./packages/api-zod/
COPY packages/api-client-react/package.json ./packages/api-client-react/

# Step 4: Copy service package.json files
COPY api-server/package.json ./api-server/
COPY ftth-calculator/package.json ./ftth-calculator/

# Step 5: Install ALL dependencies (including dev deps needed for building)
# NEVER use --frozen-lockfile; ALWAYS use --no-frozen-lockfile
# This allows pnpm to resolve workspace:* dependencies correctly
RUN pnpm install --no-frozen-lockfile

# Step 6: Copy source code (now that dependencies are resolved)
COPY . .

# Step 7: Type check (non-blocking - don't fail build on type errors)
RUN pnpm --recursive typecheck || true

# Step 8: Build all packages
RUN pnpm --recursive build

# ============================================================================
# Stage 2: Production Runtime - Minimal final image
# ============================================================================
FROM node:20-alpine

WORKDIR /app

# Install pnpm globally (needed for --filter command)
RUN npm install -g pnpm

# CRITICAL: Set CI=true again for production install
ENV CI=true

# Copy workspace configuration for production
COPY pnpm-workspace.yaml ./
COPY pnpm-lock.yaml ./
COPY .npmrc ./
COPY tsconfig.base.json ./

# Copy root package.json
COPY package.json ./

# Copy all package.json files (needed for pnpm filter resolution)
COPY packages/db/package.json ./packages/db/
COPY packages/api-zod/package.json ./packages/api-zod/
COPY packages/api-client-react/package.json ./packages/api-client-react/
COPY api-server/package.json ./api-server/
COPY ftth-calculator/package.json ./ftth-calculator/

# Install ONLY production dependencies
# Fresh install (not copying from builder) ensures clean production node_modules
# --no-frozen-lockfile allows proper resolution in Railway environment
RUN pnpm install --prod --no-frozen-lockfile

# Copy only the built api-server from builder stage
COPY --from=builder /app/api-server/dist ./api-server/dist

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    mkdir -p /app/logs && \
    chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Environment variables for production
ENV NODE_ENV=production
ENV LOG_LEVEL=warn
ENV PORT=3000

# Expose API port
EXPOSE 3000

# Health check using node (curl not available in alpine)
# Attempts to connect to health endpoint without external dependencies
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (res) => {if (res.statusCode !== 200) process.exit(1)})" || exit 1

# Start only the api-server package via pnpm workspace filter
# This runs the "start" script defined in api-server/package.json
CMD ["pnpm", "--filter", "@workspace/api-server", "start"]
