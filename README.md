# FTTH Optical Power Budget Calculator

A professional full-stack web application for calculating optical power budgets in Fiber To The Home (FTTH) networks. Built with React, TypeScript, Express.js, and PostgreSQL.

## 🎯 Features

- **Secure Authentication**: JWT-based login with device fingerprinting
- **Multiple Calculation Modules**: 
  - Find Ratio calculations
  - Splitter Ratio optimization
  - Jalur Lurus (straight path) analysis
  - Jalur Percabangan (branching path) analysis  
  - Mix Ratio configurations
- **Project Management**: Save and retrieve calculation history
- **Role-Based Access**: Admin and user roles with different permissions
- **Responsive UI**: Modern design with Tailwind CSS and shadcn/ui components
- **Input Validation**: Comprehensive Zod validation on all endpoints
- **Professional Logging**: Structured logging with Pino

## 📋 Project Structure

```
ftth-calculator/
├── api-server/              # Backend API (Express.js)
│   ├── src/
│   │   ├── routes/         # API endpoints
│   │   ├── lib/            # Utilities & calculations
│   │   ├── app.ts          # Express configuration
│   │   └── index.ts        # Server entry point
│   └── package.json
│
├── ftth-calculator/         # Frontend (React + Vite)
│   ├── src/
│   │   ├── pages/          # Page components
│   │   ├── components/     # Reusable components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utilities
│   │   └── main.tsx        # Entry point
│   └── package.json
│
├── packages/                # Shared packages
│   ├── db/                 # Database schemas
│   ├── api-zod/            # API validation schemas
│   └── api-client-react/   # React API client
│
├── .env.example             # Environment variables template
├── DEPLOYMENT.md            # Production deployment guide
└── README.md               # This file
```

## 🚀 Quick Start

### Prerequisites
- **Node.js**: 18.x or higher
- **pnpm**: 8.x or higher (`npm install -g pnpm`)
- **PostgreSQL**: 12.x or higher

### Development Setup

1. **Install pnpm** (if not already installed)
   ```bash
   npm install -g pnpm
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your PostgreSQL credentials and secrets
   ```

4. **Start development servers**
   
   Terminal 1 - API Server:
   ```bash
   cd api-server
   pnpm dev
   # Output: Server running on port 3000
   ```

   Terminal 2 - Frontend:
   ```bash
   cd ftth-calculator
   pnpm dev
   # Output: http://localhost:5173
   ```

5. **Login to the application**
   - Default admin username: `maul`
   - Default admin password: Check your `.env` file
   - Access at http://localhost:5173

## 🔐 Environment Variables

See `.env.example` for all available options. Key variables:

```
DATABASE_URL=postgres://user:pass@localhost:5432/ftth
SESSION_SECRET=your-jwt-secret-key
ADMIN_PASSWORD=your-admin-password
NODE_ENV=development
```

## 📦 Build for Production

### Full Build

```bash
# From project root, build entire monorepo
pnpm --recursive clean      # Clean previous builds
pnpm install --prod         # Install production dependencies only
pnpm --recursive build      # Build all packages
pnpm --recursive typecheck  # Verify TypeScript
```

### Production Preview

```bash
# Test the production build locally
cd api-server
NODE_ENV=production pnpm start:prod

# In another terminal
cd ftth-calculator
pnpm preview
```

## 🚀 Deployment

### For Detailed Deployment Instructions

See [PNPM-BUILD-GUIDE.md](./PNPM-BUILD-GUIDE.md) for comprehensive information on:
- pnpm workspace management
- Production build process
- Multiple deployment options (Docker, Nginx, PM2)
- Performance optimization
- Monitoring & health checks
- CI/CD integration
- Backup & recovery strategies

### Quick Production Deploy

```bash
# 1. Setup environment
cp .env.example .env
# Edit .env with production values

# 2. Build
pnpm install --prod
pnpm --recursive build
pnpm --recursive typecheck

# 3. Start services
# Option A: Direct Node.js
NODE_ENV=production pnpm --filter @workspace/api-server start:prod

# Option B: Docker
docker build -t ftth-calculator .
docker run -p 3000:3000 -e DATABASE_URL="..." ftth-calculator

# Option C: PM2
pm2 start ecosystem.config.js --env production
```

### For Detailed Deployment Instructions

See [DEPLOYMENT.md](./DEPLOYMENT.md)

## 🔒 Security Features

✅ **Implemented:**
- JWT authentication (7-day expiry)
- Bcrypt password hashing (10 salt rounds)
- Device fingerprinting for account binding
- Input validation with Zod schemas
- CORS protection
- Admin authorization middleware
- Sensitive data redaction in logs
- Security headers (X-Content-Type-Options, X-Frame-Options, etc.)
- Request payload size limiting (10KB)

## 📊 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout

### Calculations
- `POST /api/calculations/find-ratio` - Find ratio calculation
- `POST /api/calculations/splitter-ratio` - Splitter ratio calculation
- `POST /api/calculations/jalur-lurus` - Straight path analysis
- `POST /api/calculations/jalur-percabangan` - Branching analysis
- `POST /api/calculations/mix-ratio` - Mix ratio calculation

### Project Management
- `GET /api/projects` - List user projects
- `POST /api/projects` - Create new project
- `GET /api/projects/:id` - Get project details
- `DELETE /api/projects/:id` - Delete project

### User Management (Admin Only)
- `GET /api/users` - List all users
- `POST /api/users` - Create new user
- `DELETE /api/users/:id` - Delete user
- `POST /api/users/:id/reset-device` - Reset device fingerprint

## 🧪 Testing

### TypeScript Checking
```bash
pnpm run typecheck
```

### Database Validation
```bash
# Check database connection
psql $DATABASE_URL -c "SELECT version();"
```

## 🔧 Development Tools

- **TypeScript**: Full type safety across the stack
- **Zod**: Runtime schema validation
- **Drizzle ORM**: Type-safe database queries
- **React Query**: Server state management
- **Vite**: Fast build tool and dev server
- **Tailwind CSS**: Utility-first styling
- **Pino**: High-performance logging
- **Express**: Minimal web framework

## 📝 Database Schema

### Users Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT,
  password_hash TEXT NOT NULL,
  role ENUM ('super_admin', 'user') DEFAULT 'user',
  device_fingerprint TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Projects Table
```sql
CREATE TABLE projects (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  project_name TEXT NOT NULL,
  calculation_type TEXT NOT NULL,
  inputs JSON NOT NULL,
  results JSON NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Kill process on port 3000
lsof -i :3000 | grep LISTEN | awk '{print $2}' | xargs kill -9
```

### Database Connection Issues
```bash
# Test connection
psql $DATABASE_URL -c "SELECT 1;"
```

### JWT Token Errors
- Ensure `SESSION_SECRET` is set in `.env`
- Token expires after 7 days, user must login again

### Build Issues
```bash
# Clean and rebuild
rm -rf node_modules dist/
pnpm install
pnpm run build
```

## 📚 Documentation

- [DEPLOYMENT.md](./DEPLOYMENT.md) - Production deployment guide
- [.env.example](./.env.example) - Environment variables reference

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Run `pnpm run typecheck` to validate TypeScript
4. Submit a pull request

## 📄 License

Private project - All rights reserved

## 🆘 Support

For deployment issues, see [DEPLOYMENT.md](./DEPLOYMENT.md)

---

**Last Updated**: March 31, 2026  
**Version**: 1.0.0

