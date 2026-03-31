#!/bin/bash
# Development Setup Script
# Usage: ./scripts/setup-dev.sh

set -e  # Exit on error

echo "🚀 FTTH Calculator - Development Setup"
echo "======================================"

# Check for pnpm
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm not found. Installing..."
    npm install -g pnpm
fi

echo "✅ pnpm version: $(pnpm --version)"
echo "✅ Node.js version: $(node --version)"
echo ""

# 1. Install dependencies
echo "📦 Step 1: Installing dependencies..."
pnpm install

# 2. Setup environment
echo "🔐 Step 2: Setting up environment..."
if [ ! -f ".env" ]; then
    echo "  Creating .env from .env.example..."
    cp .env.example .env
    echo "  ⚠️  Edit .env with your local database credentials"
else
    echo "  ✅ .env already exists"
fi

# 3. Type checking
echo "🔍 Step 3: Running type checks..."
pnpm --recursive typecheck

# 4. Display instructions
echo ""
echo "✅ Development setup completed!"
echo ""
echo "📝 Next steps:"
echo ""
echo "  Terminal 1 - API Server:"
echo "    cd api-server && pnpm dev"
echo ""
echo "  Terminal 2 - Frontend:"
echo "    cd ftth-calculator && pnpm dev"
echo ""
echo "  Then open: http://localhost:5173"
echo ""
echo "📚 Documentation:"
echo "  - README.md - Project overview"
echo "  - PNPM-BUILD-GUIDE.md - Full build & deployment guide"
echo "  - DEPLOYMENT.md - Advanced deployment options"
echo ""
