#!/bin/bash
# Production Build & Deploy Script
# Usage: ./scripts/build-production.sh

set -e  # Exit on error

echo "🏗️  FTTH Calculator - Production Build"
echo "======================================"

# Check for pnpm
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm not found. Install with: npm install -g pnpm"
    exit 1
fi

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 18+"
    exit 1
fi

echo "✅ pnpm version: $(pnpm --version)"
echo "✅ Node.js version: $(node --version)"
echo ""

# 1. Clean previous builds
echo "📦 Step 1: Cleaning previous builds..."
pnpm --recursive clean
rm -rf node_modules

# 2. Install production dependencies
echo "📦 Step 2: Installing production dependencies..."
pnpm install --prod --frozen-lockfile

# 3. Type checking
echo "🔍 Step 3: Type checking..."
pnpm --recursive typecheck || {
    echo "⚠️  TypeScript errors found. Fix before deploying."
    exit 1
}

# 4. Build all packages
echo "🔨 Step 4: Building all packages..."
pnpm --recursive build

# 5. Verify builds
echo "✅ Step 5: Verifying builds..."
if [ ! -f "api-server/dist/index.mjs" ]; then
    echo "❌ API build failed"
    exit 1
fi

if [ ! -f "ftth-calculator/dist/public/index.html" ]; then
    echo "❌ Frontend build failed"
    exit 1
fi

# 6. Generate manifest
echo "📋 Step 6: Generation manifest..."
cat > BUILD_MANIFEST.json << EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "version": "1.0.0",
  "node_version": "$(node --version)",
  "pnpm_version": "$(pnpm --version)",
  "git_commit": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
  "artifacts": {
    "api_server": "api-server/dist/index.mjs",
    "frontend": "ftth-calculator/dist/public/index.html"
  }
}
EOF

echo ""
echo "🎉 Production build completed successfully!"
echo ""
echo "📊 Build Summary:"
echo "  - API Server: $(du -sh api-server/dist | cut -f1)"
echo "  - Frontend: $(du -sh ftth-calculator/dist/public | cut -f1)"
echo "  - Dependencies: $(du -sh node_modules | cut -f1)"
echo ""
echo "📝 Next steps:"
echo "  1. Verify .env has production values"
echo "  2. Run: NODE_ENV=production pnpm --filter @workspace/api-server start:prod"
echo "  3. Monitor: pm2 logs or docker logs"
echo ""
echo "📚 See PNPM-BUILD-GUIDE.md for detailed deployment instructions"
