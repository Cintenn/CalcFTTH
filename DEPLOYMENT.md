# FTTH Optical Power Budget Calculator - Production Deployment Guide

## Overview
This is a full-stack application consisting of:
- **Frontend**: React + Vite + TypeScript
- **Backend**: Express.js + Node.js
- **Database**: PostgreSQL
- **Authentication**: JWT + Device Fingerprinting

## Prerequisites

- Node.js 18+ / npm 9+ or pnpm 8+
- PostgreSQL 12+
- Linux/Unix environment (for production)

## Setup Instructions

### 1. Environment Configuration

Copy `.env.example` to `.env` and update all required variables:

```bash
cp .env.example .env
```

**Critical variables to configure:**
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Strong random string for JWT (generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
- `ADMIN_PASSWORD`: Strong password for default admin user
- `NODE_ENV`: Set to "production" for production deployments

### 2. Database Setup

PostgreSQL database will be automatically initialized on first API server start. Ensure:
- PostgreSQL is running
- DATABASE_URL points to an accessible database
- User has permission to create tables and schemas

### 3. Install Dependencies

```bash
# Install all workspace dependencies
pnpm install

# Or if using npm
npm install
```

### 4. Build for Production

```bash
# Build the entire workspace
pnpm run build

# Or individually:
pnpm --filter @workspace/ftth-calculator build
pnpm --filter @workspace/api-server build
```

### 5. Start the Application

#### Option A: Run Both Services with a Single Process Manager

Using PM2 (recommended):
```bash
npm install -g pm2
pm2 start ecosystem.config.js
pm2 save
```

#### Option B: Run Services Separately

**Terminal 1 - API Server:**
```bash
cd api-server
pnpm start
# Output: Server running on port 3000
```

**Terminal 2 - Frontend (production preview):**
```bash
cd ftth-calculator
pnpm serve
# Output: Listening on http://localhost:5173
```

#### Using Docker (Recommended for Production)

See Docker deployment section below.

## Deployment Checklist

- [ ] Update `DATABASE_URL` with production PostgreSQL credentials
- [ ] Generate and set strong `SESSION_SECRET`
- [ ] Set `NODE_ENV=production`
- [ ] Update `ADMIN_PASSWORD` to a strong unique password
- [ ] Ensure `LOG_LEVEL=warn` in production (reduces overhead)
- [ ] Configure firewall rules (expose only port 80, 443, not 3000, 5173)
- [ ] Set up HTTPS/SSL with reverse proxy (Nginx)
- [ ] Configure database backups
- [ ] Enable monitoring and logging

## Architecture

```
┌─────────────────────────────────────┐
│      Client Browser (React)         │
│      Port: 80/443 (via Nginx)       │
└──────────────────┬──────────────────┘
                   │ /api/* requests
┌──────────────────▼──────────────────┐
│   Nginx Reverse Proxy               │
│   - Static file serving             │
│   - API routing                     │
│   - SSL/TLS termination             │
└──────────────────┬──────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
┌───────▼────────┐   ┌───────▼────────┐
│  API Server    │   │   PostgreSQL   │
│  Port: 3000    │   │   Port: 5432   │
│  (Node.js)     │   │   (Database)   │
└────────────────┘   └────────────────┘
```

## Performance Optimization

### Frontend Build
- Vite automatically:
  - Minifies JS/CSS
  - Bundles and tree-shakes code
  - Optimizes assets
  - Enables lazy loading routes

### Backend
- Request validation with Zod (prevents invalid data)
- Database query optimization with Drizzle ORM
- Structured logging with Pino (high performance)
- Input sanitization on all endpoints

### Database
```sql
-- Recommended indexes (create in DB)
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_created_at ON projects(created_at);
```

## Security Hardening

### ✅ Already Implemented
- JWT authentication with 7-day expiry
- Bcrypt password hashing (10 salt rounds)
- Device fingerprinting for account binding
- Input validation on all endpoints (Zod schemas)
- CORS protection
- Authorization checks (admin middleware)
- Sensitive headers redaction in logs

### 🔒 Additional Recommendations

1. **HTTPS/SSL**: Always use in production
```bash
# Install certbot for Let's Encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot certonly --nginx -d yourdomain.com
```

2. **Rate Limiting** (add to api-server if needed):
```javascript
import rateLimit from "express-rate-limit";
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use("/api/", limiter);
```

3. **CORS Configuration** (update in app.ts):
```javascript
app.use(cors({
  origin: "https://yourdomain.com",
  credentials: true,
}));
```

4. **Content Security Policy**:
```javascript
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'"],
  }
}));
```

5. **Environment Variables**: Never commit `.env` to version control
```bash
echo ".env" >> .gitignore
```

## Reverse Proxy Configuration (Nginx)

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # Serve static frontend
    location / {
        root /var/www/ftth-calculator/dist/public;
        try_files $uri /index.html;
    }
    
    # Proxy API requests
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Database Migrations

If adding new tables/migrations in future:
```bash
# Drizzle ORM migrations (if configured)
pnpm --filter @workspace/db migrate
```

The current setup uses raw SQL initialization in `db-init.ts` which runs automatically on server start.

## Monitoring & Logs

### Server Logs
- Backend logs go to stdout (captured by PM2/Docker)
- Frontend logs available in browser console

### Log Levels
```
NODE_ENV=production LOG_LEVEL=warn pnpm --filter @workspace/api-server start
```

### Health Check
```bash
curl http://localhost:3000/api/health
```

## Troubleshooting

### "PORT already in use"
```bash
# Find and kill process on port 3000
lsof -i :3000 | grep LISTEN | awk '{print $2}' | xargs kill -9
```

### "DATABASE_URL is invalid"
- Check PostgreSQL is running
- Verify connection string format: `postgres://user:password@host:port/dbname`
- Test with: `psql $DATABASE_URL`

### "SESSION_SECRET not set"
- Required for JWT generation
- Generate with: `openssl rand -hex 32`
- Add to `.env` file

### JWT Token Expired
- JWT expires after 7 days by default
- Users must log in again to get new token
- Configure expiry in `api-server/src/routes/auth.ts` if needed

## Updating the Application

```bash
# Pull latest code
git pull origin main

# Install new dependencies
pnpm install

# Rebuild
pnpm run build

# Restart services
pm2 restart all
```

## Backup Strategy

### Database Backups
```bash
# Daily backup at 2 AM
0 2 * * * pg_dump $DATABASE_URL > /backups/ftth-$(date +\%Y\%m\%d).sql

# Monthly retention: keep last 30 days
find /backups -name "ftth-*.sql" -mtime +30 -delete
```

### Application Backups
```bash
# Back up dist files
tar -czf /backups/ftth-app-$(date +%Y%m%d).tar.gz \
  ftth-calculator/dist/ api-server/dist/
```

## Support & Issues

For issues or questions:
1. Check logs: `pm2 logs`
2. Verify environment variables are set
3. Ensure database is accessible
4. Check firewall rules

---

**Last Updated**: March 31, 2026
**Version**: 1.0.0
