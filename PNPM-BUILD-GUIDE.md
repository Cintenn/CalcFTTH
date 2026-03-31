# pnpm Build & Deployment Guide

This guide provides step-by-step instructions for building and deploying the FTTH Calculator application using pnpm.

## Prerequisites

- **Node.js**: 18.x or higher
- **pnpm**: 8.x or higher (`npm install -g pnpm`)
- **PostgreSQL**: 12.x or higher
- **Git**: For version control

## Project Structure

This is a monorepo managed with pnpm workspaces:

```
ftth-calculator/
├── api-server/          # Node.js Express API backend
├── ftth-calculator/     # React Vite frontend
├── packages/
│   ├── db/             # Database schemas
│   ├── api-zod/        # API validation schemas
│   └── api-client-react/ # React API client
├── pnpm-workspace.yaml  # Workspace configuration
├── .npmrc              # pnpm configuration
└── pnpm-lock.yaml      # Locked dependency versions
```

## Environment Setup

### 1. Install & Configure

```bash
# Install pnpm globally (if needed)
npm install -g pnpm

# Navigate to project root
cd ~/Projects/FTTH-Calculator

# Install all dependencies (uses pnpm-lock.yaml for reproducible builds)
pnpm install

# Verify installation
pnpm --version
pnpm list --depth=0
```

### 2. Environment Variables

```bash
# Copy example to .env
cp .env.example .env

# Edit .env with your production values
# Critical variables:
# - DATABASE_URL: PostgreSQL connection string
# - SESSION_SECRET: Strong random JWT secret
# - ADMIN_PASSWORD: Administrator password
# - NODE_ENV: "production" for production
# - LOG_LEVEL: "warn" for production (fewer overhead)
```

## Development Build

### Build & Run for Development

```bash
# Terminal 1: Start API server
cd api-server
pnpm dev
# Output: Server running on port 3000

# Terminal 2: Start frontend
cd ftth-calculator
pnpm dev
# Output: http://localhost:5173
```

### Type Checking

```bash
# Check TypeScript types for entire workspace
pnpm --recursive typecheck

# Or individually
pnpm --filter @workspace/api-server typecheck
pnpm --filter @workspace/ftth-calculator typecheck
```

## Production Build

### Full Production Build

```bash
# From project root, build entire monorepo
pnpm --recursive clean     # Clean previous builds
pnpm install              # Ensure lock is up to date
pnpm --recursive build    # Build all packages
pnpm --recursive typecheck # Verify types

# Verify builds succeeded
ls -la api-server/dist/
ls -la ftth-calculator/dist/public/
```

### Individual Builds

```bash
# Build API server only
pnpm --filter @workspace/api-server clean
pnpm --filter @workspace/api-server build

# Build frontend only
pnpm --filter @workspace/ftth-calculator clean
pnpm --filter @workspace/ftth-calculator build
```

### Build Output

```
api-server/
└── dist/
    ├── index.mjs           # Main API entry point
    └── *.mjs               # Bundled ESM modules

ftth-calculator/
└── dist/
    └── public/
        ├── index.html      # React entry point
        ├── assets/         # Minified JS/CSS
        └── images/         # Optimized images
```

## Production Deployment

### Prerequisites Setup

1. **PostgreSQL Database**
   ```bash
   # Create database (replace with your credentials)
   createdb ftth
   PGPASSWORD=your_password psql -U postgres -h localhost -c "CREATE DATABASE ftth;"
   ```

2. **Environment Configuration**
   ```bash
   # Set production environment variables
   export DATABASE_URL="postgres://user:password@localhost:5432/ftth"
   export SESSION_SECRET="$(openssl rand -hex 32)"
   export ADMIN_PASSWORD="strong-random-password"
   export NODE_ENV="production"
   export LOG_LEVEL="warn"
   ```

3. **SSL/TLS Certificates** (if using HTTPS)
   ```bash
   # Using Let's Encrypt with Nginx
   sudo certbot certonly --nginx -d yourdomain.com
   ```

### Option 1: Direct Node.js Deployment

```bash
# Build
pnpm --recursive clean
pnpm install --prod    # Install only production dependencies
pnpm --recursive build
pnpm --recursive typecheck

# Terminal 1: Start API server
cd api-server
NODE_ENV=production pnpm start:prod
# Output: Server running on port 3000

# Terminal 2: Serve frontend
cd ftth-calculator
pnpm preview
# Output: Listening on port 5173
```

### Option 2: Docker Deployment (Recommended)

Create `Dockerfile` in project root:

```dockerfile
FROM node:20-alpine

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy workspace files
COPY pnpm-workspace.yaml pnpm-lock.yaml .npmrc tsconfig.base.json ./
COPY api-server ./api-server
COPY ftth-calculator ./ftth-calculator
COPY packages ./packages

# Install and build
RUN pnpm install --prod
RUN pnpm --recursive build
RUN pnpm --recursive typecheck

# Build optimizations
FROM node:20-alpine

WORKDIR /app

# Copy built artifacts only
COPY --from=0 /app/api-server/dist ./api-server/dist
COPY --from=0 /app/ftth-calculator/dist/public ./ftth-calculator/dist/public
COPY --from=0 /app/node_modules ./node_modules

# Environment
ENV NODE_ENV=production
ENV LOG_LEVEL=warn

# Start API server
EXPOSE 3000
CMD ["node", "--enable-source-maps", "./api-server/dist/index.mjs"]
```

Build and run:
```bash
docker build -t ftth-calculator:latest .
docker run -p 3000:3000 \
  -e DATABASE_URL="postgres://..." \
  -e SESSION_SECRET="..." \
  -e ADMIN_PASSWORD="..." \
  ftth-calculator:latest
```

### Option 3: Nginx Reverse Proxy

Configure `nginx.conf`:

```nginx
# Serve API on port 3000 (internal only)
server {
    listen 3000;
    server_name 127.0.0.1;
    
    location / {
        proxy_pass http://127.0.0.1:3001;  # Node.js actual server
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}

# Serve frontend and proxy API
server {
    listen 80;
    server_name yourdomain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # Serve static frontend
    location / {
        root /var/www/ftth-calculator;
        try_files $uri /index.html;
    }
    
    # Proxy API requests
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Start Nginx:
```bash
sudo systemctl start nginx
sudo systemctl enable nginx
```

### Option 4: PM2 Process Manager

```bash
# Install PM2 globally
npm install -g pm2

# Create ecosystem.config.js
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: "ftth-api",
      script: "./api-server/dist/index.mjs",
      env_production: {
        NODE_ENV: "production",
        LOG_LEVEL: "warn",
      },
      max_memory_restart: "512M",
      error_file: "./logs/api-error.log",
      out_file: "./logs/api-out.log",
    },
    {
      name: "ftth-frontend",
      script: "./node_modules/.bin/vite",
      args: "preview --config ftth-calculator/vite.config.ts",
      env_production: {
        NODE_ENV: "production",
      },
      max_memory_restart: "256M",
      error_file: "./logs/frontend-error.log",
      out_file: "./logs/frontend-out.log",
    }
  ]
};
EOF

# Start with PM2
pm2 start ecosystem.config.js --env production

# View logs
pm2 logs

# Restart on reboot
pm2 startup
pm2 save

# Monitor
pm2 monit
```

## Dependency Management

### Install Production Dependencies Only

```bash
# In CI/CD, use --prod flag to skip dev dependencies
pnpm install --prod
```

### Check for Vulnerabilities

```bash
# Audit all workspace packages
pnpm audit

# Fix vulnerabilities (if available)
pnpm audit --fix
```

### Update Dependencies Safely

```bash
# Check outdated packages
pnpm outdated

# Update interactively
pnpm update -i -r

# Update specific package
pnpm update @workspace/api-server
```

## Performance Optimization

### Frontend Optimization

The Vite build automatically:
- ✅ Minifies JavaScript and CSS
- ✅ Removes unused code (tree-shaking)
- ✅ Bundles and optimizes assets
- ✅ Generates source maps (disabled in prod)
- ✅ Optimizes images

Verify in `ftth-calculator/vite.config.ts`

### Backend Optimization

The esbuild bundler automatically:
- ✅ Bundles all dependencies
- ✅ Uses ESM format (more efficient)
- ✅ Minifies code
- ✅ Uses source maps for debugging
- ✅ Externalizes native modules

Verify in `api-server/build.mjs`

### Database Optimization

```sql
-- Create recommended indexes
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_created_at ON projects(created_at);

-- Verify indexes
SELECT * FROM pg_indexes WHERE schemaname = 'public';
```

## Health Checks & Monitoring

### Health Check Endpoint

```bash
# Verify API is running
curl http://localhost:3000/api/health
# Expected: { "status": "ok" }
```

### Database Health

```bash
# Test connection
psql $DATABASE_URL -c "SELECT NOW();"

# Check database size
psql $DATABASE_URL -c "SELECT pg_database.datname, pg_size_pretty(pg_database_size(pg_database.datname)) FROM pg_database;"
```

### Log Monitoring

```bash
# Follow API logs
pm2 logs ftth-api

# Check all logs
ls -lh logs/

# Rotate logs in cron (every day at midnight)
0 0 * * * find /path/to/logs -name "*.log" -mtime +30 -delete
```

## Troubleshooting

### Port Already in Use

```bash
# Find process on port 3000
lsof -i :3000

# Kill process
kill -9 <PID>
```

### Dependency Issues

```bash
# Clean install
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Verify workspace
pnpm list --depth=0
```

### Build Failures

```bash
# Clean all builds
pnpm --recursive clean

# Rebuild with verbose output
pnpm --recursive build --verbose

# Check TypeScript errors
pnpm --recursive typecheck
```

### Database Connection

```bash
# Test PostgreSQL
psql $DATABASE_URL -c "SELECT 1;"

# Check DATABASE_URL format
echo $DATABASE_URL
# Expected: postgres://user:password@host:5432/dbname
```

### Session Secret Issues

```bash
# Generate new SESSION_SECRET if lost
openssl rand -hex 32

# Update in .env
echo "SESSION_SECRET=<generated-value>" >> .env
```

## Continuous Integration (CI/CD)

### GitHub Actions Example

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s

    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js with pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8
      
      - uses: actions/setup-node@v3
        with:
          node-version: 20
          cache: pnpm
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Type check
        run: pnpm --recursive typecheck
      
      - name: Build
        run: pnpm --recursive build
      
      - name: Deploy
        run: ./scripts/deploy.sh
```

## Backup & Recovery

### Database Backup

```bash
# Full backup
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Compress
gzip backup-*.sql

# Restore
psql $DATABASE_URL < backup-20260331.sql
```

### Automated Daily Backups

```bash
# Add to crontab
0 2 * * * pg_dump $DATABASE_URL | gzip > /backups/ftth-$(date +\%Y\%m\%d).sql.gz

# Keep last 30 days
0 3 * * * find /backups -name "ftth-*.sql.gz" -mtime +30 -delete
```

## Production Checklist

- [ ] ✅ Database created and accessible
- [ ] ✅ .env configured with production values
- [ ] ✅ SESSION_SECRET is strong and unique
- [ ] ✅ ADMIN_PASSWORD is strong and unique
- [ ] ✅ NODE_ENV=production
- [ ] ✅ LOG_LEVEL=warn for production
- [ ] ✅ pnpm install --prod completed
- [ ] ✅ Build completed without errors
- [ ] ✅ Typecheck passed
- [ ] ✅ SSL/TLS configured (HTTPS)
- [ ] ✅ Reverse proxy configured
- [ ] ✅ Backups scheduled
- [ ] ✅ Monitoring configured
- [ ] ✅ Health checks verified

## Additional Resources

- [pnpm Documentation](https://pnpm.io/)
- [Node.js Best Practices](https://nodejs.org/en/docs/guides/nodejs-performance-priority-warning/)
- [PostgreSQL Administration](https://www.postgresql.org/docs/)
- [Nginx Configuration](https://nginx.org/en/docs/)
- [PM2 Documentation](https://pm2.keymetrics.io/)

---

**Last Updated**: March 31, 2026  
**Version**: 1.0.0
