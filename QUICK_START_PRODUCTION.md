# Quick Start: Production Deployment

This guide provides the fastest path to get your FTTH Calculator running in production.

## Prerequisites

- **Node.js**: 18 or higher
- **pnpm**: 8.x or higher
- **PostgreSQL**: 12 or higher (or use Docker)
- **Git**: For version control

## 1. Install Dependencies (5 minutes)

```bash
# From project root
pnpm install

# Verify lock file is updated
git add pnpm-lock.yaml
git commit -m "Lock dependencies"
```

## 2. Set Up Environment Variables (5 minutes)

```bash
# Copy example to actual .env
cp .env.example .env

# Edit .env with production values
nano .env  # or use your preferred editor
```

**Critical variables to set:**
```env
NODE_ENV=production
SESSION_SECRET=your-very-long-random-string-32-chars-minimum
DATABASE_URL=postgresql://user:password@localhost:5432/ftth_calc
JWT_SECRET=another-random-string-32-chars-minimum
ADMIN_PASSWORD=your-secure-admin-password
CORS_ORIGIN=https://your-production-domain.com
LOG_LEVEL=warn
```

**Generate random secrets:**
```bash
# Linux/macOS
openssl rand -hex 32

# Windows PowerShell
[System.Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes([Guid]::NewGuid().ToString() + [Guid]::NewGuid().ToString()))
```

## 3. Build for Production (3 minutes)

```bash
# Clean and build
./scripts/build-production.sh

# Or manually:
pnpm run clean
pnpm install --prod
pnpm run typecheck
pnpm run build
```

**Verify build artifacts:**
- ✅ `api-server/dist/index.mjs` exists
- ✅ `ftth-calculator/dist/public/index.html` exists

## 4. Deploy: Choose Your Method

### Option A: Docker (Recommended)

**Requires**: Docker, Docker Compose

```bash
# Build image
docker build -t ftth-calculator:latest .

# Run with docker-compose
docker-compose up -d

# Check status
docker-compose logs -f api

# Health check
curl http://localhost:3000/api/health
```

**Expected output:**
```json
{"status": "ok"}
```

### Option B: Node.js + PM2

**Requires**: Node.js 18+, PM2

```bash
# Install PM2 globally
npm install -g pm2

# Start application
pm2 start ecosystem.config.js --env production

# Monitor
pm2 monit

# Check logs
pm2 logs
```

**Expected output:**
```
[ftth-api] API server running on port 3000
[ftth-frontend] Frontend server running on port 5173
```

### Option C: Node.js + Nginx

**Requires**: Node.js 18+, Nginx

```bash
# Terminal 1: Start API
cd api-server
NODE_ENV=production node ./dist/index.mjs

# Terminal 2: Start Frontend
cd ftth-calculator
pnpm preview

# Configure Nginx (see PNPM-BUILD-GUIDE.md for full config)
# Point backend proxy to http://localhost:3000
# Serve frontend static files from ftth-calculator/dist/public
```

## 5. Verify Deployment (5 minutes)

```bash
# Health check
curl https://your-domain.com/api/health
# Expected: {"status": "ok"}

# Login test
curl -X POST https://your-domain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"YOUR_ADMIN_PASSWORD"}'
# Expected: JWT token in response
```

## 6. Enable HTTPS (5 minutes)

### Using Let's Encrypt with Certbot

```bash
# Install certbot
sudo apt-get install certbot python3-certbot-nginx  # Linux

# Get certificate
sudo certbot certonly --nginx -d your-domain.com

# Auto-renew
sudo systemctl enable certbot.timer
```

### Update Nginx Config

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers HIGH:!aNULL:!MD5;
    
    # Rest of config...
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

## 7. Set Up Monitoring (10 minutes)

```bash
# Install PM2 monitoring service (if using PM2)
pm2 install pm2-logrotate  # Rotate logs
pm2 install pm2-auto-pull  # Auto git pull

# Monitor with dashboard
pm2 monit

# View logs
pm2 logs --lines 100
```

## 8. Database Setup (5 minutes)

### First-time initialization:

```bash
# API will auto-initialize schema on first run
# Verify tables created:
psql -d ftth_calc -U your_user -c "\dt"

# Create admin user (run once)
NODE_ENV=production node ./dist/index.mjs
# Make API call to create admin user:
curl -X POST http://localhost:3000/api/users/admin \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"YOUR_PASSWORD"}'
```

### Backup database:

```bash
# Daily automatic backup
pg_dump ftth_calc > backup-$(date +%Y%m%d).sql

# Schedule in cron:
crontab -e
# Add: 0 2 * * * pg_dump ftth_calc > /backups/ft-calc-$(date +\%Y\%m\%d).sql
```

## 9. Troubleshooting

### Issue: "Cannot find module..."

```bash
# Rebuild
pnpm install --prod
pnpm --recursive build
```

### Issue: "PORT 3000 already in use"

```bash
# Find and kill process using port 3000
# Linux/macOS
lsof -ti:3000 | xargs kill -9

# Windows PowerShell
Get-Process -id (Get-NetTCPConnection -LocalPort 3000).OwningProcess
```

### Issue: "DATABASE_URL not set"

```bash
# Check .env file
cat .env | grep DATABASE_URL

# If missing, add it and restart:
NODE_ENV=production node ./dist/index.mjs
```

### Issue: "TypeScript compilation errors"

```bash
# Check for errors
pnpm --recursive typecheck

# Fix and rebuild
pnpm --recursive build
```

## 10. Post-Deployment Checklist

- [ ] Application accessible at domain
- [ ] Login works with admin credentials
- [ ] Create calculation works end-to-end
- [ ] Save/retrieve projects works
- [ ] Monitoring is active
- [ ] Backup process running
- [ ] SSL certificate valid
- [ ] Logs being collected
- [ ] Team notified of deployment

## Next Steps

1. **Review full guides:**
   - [PNPM-BUILD-GUIDE.md](PNPM-BUILD-GUIDE.md) - Comprehensive deployment guide
   - [DEPLOYMENT.md](DEPLOYMENT.md) - Detailed deployment strategies
   - [PRODUCTION_CHECKLIST.md](PRODUCTION_CHECKLIST.md) - Full checklist before going live

2. **Set up monitoring:**
   - Configure error tracking (Sentry, Rollbar)
   - Set up APM (DataDog, New Relic)
   - Configure alerts for critical metrics

3. **Schedule backups:**
   - Daily database backups
   - Weekly full system snapshots
   - Test restore procedures

4. **Document procedures:**
   - Create runbooks for common issues
   - Document emergency procedures
   - Establish on-call schedule

## Support

For detailed information on any topic:
- **Workspace package setup**: See `pnpm-workspace.yaml`
- **Build configuration**: See `api-server/build.mjs` and `vite.config.ts`
- **Database schema**: See `packages/db/src/schema/`
- **API documentation**: See `api-server/src/routes/`

---

**Version**: 1.0.0  
**Last Updated**: March 31, 2026  
**Estimated Time**: ~45 minutes from zero to production
