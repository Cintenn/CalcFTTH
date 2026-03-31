# Production Deployment Checklist

Complete this checklist before deploying to production.

## 🔐 Security

- [ ] **Secrets Management**
  - [ ] SESSION_SECRET is set to a strong random string (32+ characters)
  - [ ] ADMIN_PASSWORD is changed from default
  - [ ] SSL/TLS certificate obtained (Let's Encrypt)
  - [ ] No hardcoded secrets in source code
  - [ ] `.env` file is NOT committed to git
  - [ ] `.env.example` shows only placeholder values

- [ ] **Environment Configuration**
  - [ ] NODE_ENV is set to "production"
  - [ ] LOG_LEVEL is set to "warn" (reduces logging overhead)
  - [ ] CORS_ORIGIN matches your production domain
  - [ ] API endpoints only accessible from authenticated users
  - [ ] Admin endpoints protected with adminMiddleware

- [ ] **Code Security**
  - [ ] No `console.log()` statements in production code
  - [ ] No debug code or development-only branches
  - [ ] No XSS vulnerabilities (no unsafe innerHTML)
  - [ ] CSRF protection enabled
  - [ ] SQL injection prevented (using Zod validation)
  - [ ] Rate limiting configured on sensitive endpoints

## 📦 Dependencies

- [ ] **Dependency Audit**
  - [ ] `pnpm audit` shows no critical vulnerabilities
  - [ ] Unused dependencies removed (e.g., cookie-parser)
  - [ ] All dependencies pinned in pnpm-lock.yaml
  - [ ] No dev dependencies included in production build
  - [ ] `pnpm install --prod` works correctly

- [ ] **Package Management**
  - [ ] pnpm version 8+ installed
  - [ ] Node.js version 18+ available
  - [ ] pnpm-lock.yaml is committed to version control
  - [ ] pnpm scripts verified in package.json

## 🏗️ Build Quality

- [ ] **Build Process**
  - [ ] `pnpm --recursive build` completes without errors
  - [ ] `pnpm --recursive typecheck` passes
  - [ ] Build output directories created:
    - [ ] `api-server/dist/index.mjs` exists
    - [ ] `ftth-calculator/dist/public/index.html` exists
  - [ ] No TypeScript errors
  - [ ] No warnings in build output

- [ ] **Asset Optimization**
  - [ ] JavaScript minified in production builds
  - [ ] CSS minified in production builds
  - [ ] Source maps disabled in production (production build only)
  - [ ] Images optimized
  - [ ] Favicon properly referenced

## 🗄️ Database

- [ ] **Connection & Access**
  - [ ] PostgreSQL server is running and accessible
  - [ ] DATABASE_URL is correctly formatted and tested
  - [ ] Database user has proper permissions
  - [ ] Connection pool configured appropriately
  - [ ] Read-only replica configured (if available)

- [ ] **Schema & Data**
  - [ ] Database schema initialized on first run
  - [ ] All migrations applied successfully
  - [ ] Default admin user created
  - [ ] No unapplied migrations
  - [ ] Indexes created for performance:
    - [ ] users(username)
    - [ ] projects(user_id)
    - [ ] projects(created_at)

- [ ] **Backup Strategy**
  - [ ] Daily automated backups scheduled
  - [ ] Backup retention policy defined (e.g., 30 days)
  - [ ] Test restoration process works
  - [ ] Backup storage is secure and redundant
  - [ ] Disaster recovery plan documented

## 🚀 Deployment

- [ ] **Infrastructure**
  - [ ] Server hardware meets minimum requirements
  - [ ] Firewall configured (only 80, 443, and managed ports open)
  - [ ] SSH access secured (key-based authentication)
  - [ ] Server OS updated with latest patches
  - [ ] Monitoring tools installed

- [ ] **Application Deployment**
  - [ ] Choose deployment method:
    - [ ] Docker (recommended)
    - [ ] Node.js + PM2
    - [ ] Cloud Platform (Vercel, Render, AWS, etc.)
  - [ ] Reverse proxy configured (Nginx recommended)
  - [ ] Static files served from CDN (optional)
  - [ ] Load balancer configured (if needed)

- [ ] **Service Configuration**
  - [ ] API service starts automatically on boot
  - [ ] Frontend served by reverse proxy
  - [ ] Health checks configured and working
  - [ ] Graceful shutdown configured (30 second timeout)
  - [ ] Process restart on failure configured

## 🔐 API Security

- [ ] **Endpoints**
  - [ ] All endpoints require authentication (except /login)
  - [ ] Authorization checks on protected routes
  - [ ] Input validation on all endpoints
  - [ ] Error messages don't leak sensitive information
  - [ ] Rate limiting on login endpoint

- [ ] **Authentication**
  - [ ] JWT expiration set (7 days)
  - [ ] Device fingerprinting prevents account takeover
  - [ ] Password hashing uses bcrypt (10+ rounds)
  - [ ] Session secret is sufficiently random
  - [ ] Token refresh mechanism (if needed)

- [ ] **HTTPS/TLS**
  - [ ] SSL/TLS certificate installed
  - [ ] HTTPS enforced (redirect HTTP → HTTPS)
  - [ ] HSTS header enabled
  - [ ] Certificate renewal automated (certbot)
  - [ ] TLS version 1.2+ enforced

## 🌐 Reverse Proxy (Nginx)

- [ ] **Configuration**
  - [ ] Virtual host configured for domain
  - [ ] Static files served with cache headers
  - [ ] API requests proxied to Node.js server
  - [ ] Gzip compression enabled
  - [ ] Security headers added:
    - [ ] X-Content-Type-Options: nosniff
    - [ ] X-Frame-Options: DENY
    - [ ] X-XSS-Protection: 1; mode=block

- [ ] **Performance**
  - [ ] Browser caching configured (3600+ seconds)
  - [ ] CDN integration (optional)
  - [ ] Compression enabled for text assets
  - [ ] Connection pooling configured

## 📊 Monitoring & Logging

- [ ] **Logging**
  - [ ] Application logs written to file
  - [ ] Log rotation configured
  - [ ] Sensitive data excluded from logs
  - [ ] Log level set to "warn" in production
  - [ ] Structured logging with request IDs

- [ ] **Monitoring**
  - [ ] Uptime monitoring configured
  - [ ] Error tracking enabled (e.g., Sentry)
  - [ ] Performance monitoring enabled
  - [ ] Disk space monitoring
  - [ ] Memory usage alerts configured
  - [ ] CPU usage alerts configured

- [ ] **Alerting**
  - [ ] Alert channels configured (email, Slack, etc.)
  - [ ] On-call rotation defined
  - [ ] Incident response procedures documented
  - [ ] Runbooks for common issues created

## 📧 Notifications

- [ ] **Alerts Configured For**
  - [ ] Server down or unresponsive
  - [ ] Database connection failure
  - [ ] High error rate (>5% in 5 minutes)
  - [ ] Disk space critical (<10% free)
  - [ ] Memory usage critical (>90%)
  - [ ] SSL certificate expiring soon (<30 days)

## ✅ Testing

- [ ] **Functional Testing**
  - [ ] Login flow works
  - [ ] Create project works
  - [ ] Run calculations work
  - [ ] Save/retrieve project history works
  - [ ] Logout works correctly

- [ ] **Performance Testing**
  - [ ] Page load time < 3 seconds
  - [ ] API response time < 500ms
  - [ ] Database query time < 100ms
  - [ ] Concurrent users handled: at least 50

- [ ] **Security Testing**
  - [ ] SQL injection tests passed
  - [ ] XSS vulnerability tests passed
  - [ ] CSRF protection verified
  - [ ] Authentication bypass attempts failed
  - [ ] SSL/TLS scan grade: A or A+

## 📚 Documentation

- [ ] **README**
  - [ ] Installation instructions clear
  - [ ] Environment variables documented
  - [ ] Deployment options explained
  - [ ] Troubleshooting section included

- [ ] **Operational Guides**
  - [ ] PNPM-BUILD-GUIDE.md reviewed
  - [ ] DEPLOYMENT.md reviewed
  - [ ] Architecture diagram available
  - [ ] Emergency procedures documented
  - [ ] Team has access to documentation

## 👥 Team Readiness

- [ ] **Knowledge**
  - [ ] Team trained on deployment process
  - [ ] Team trained on monitoring systems
  - [ ] Team trained on incident response
  - [ ] Runbooks reviewed and understood

- [ ] **Communication**
  - [ ] Deployment notification plan defined
  - [ ] Rollback procedure documented
  - [ ] On-call schedule established
  - [ ] Escalation procedures defined

## 🔄 Deployment Process

- [ ] **Pre-Deployment**
  - [ ] All code changes merged to main branch
  - [ ] All tests passing
  - [ ] Code review completed
  - [ ] Staging deployment tested first

- [ ] **Deployment Execution**
  - [ ] Deployment window scheduled
  - [ ] Team members on standby
  - [ ] Backups created before deployment
  - [ ] Formal "go" decision documented

- [ ] **Post-Deployment**
  - [ ] Health checks passing
  - [ ] Monitoring data normal
  - [ ] User-facing features tested
  - [ ] Support team notified
  - [ ] Deployment documented in changelog

## 📋 Final Verification

- [ ] **Access & Functionality**
  - [ ] Web application accessible at domain
  - [ ] Login works with admin credentials
  - [ ] Create new calculation works end-to-end
  - [ ] Save project works
  - [ ] Retrieve saved projects works

- [ ] **Performance**
  - [ ] Page loads in reasonable time
  - [ ] No console errors in browser
  - [ ] API responds quickly
  - [ ] Database queries efficient

- [ ] **Security**
  - [ ] HTTPS working correctly
  - [ ] SSL certificate valid
  - [ ] Secure headers present
  - [ ] No sensitive data in requests/responses

## 🎉 Deployment Complete

Date: ________________  
Deployed By: ________________  
Verified By: ________________  
Notes/Issues: ________________  

---

## Rollback Plan

If critical issues are discovered:

1. [ ] Notify team immediately
2. [ ] Trigger rollback procedure
3. [ ] Restore previous database backup (if needed)
4. [ ] Redeploy previous stable version
5. [ ] Verify functionality
6. [ ] Document incident
7. [ ] Schedule post-mortem

---

**Document Version**: 1.0.0  
**Last Updated**: March 31, 2026
