#!/bin/bash

# Stock Insights UI - Setup Script
# This script sets up the development environment for the frontend

set -e  # Exit on error

echo "🚀 Setting up Stock Insights UI..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

# Check Node version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"
echo ""

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed."
    exit 1
fi

echo "✅ npm version: $(npm -v)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install
echo "✅ Dependencies installed"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from example..."
    
    # Create .env with default values
    cat > .env << 'EOF'
# API Configuration
VITE_API_BASE_URL=http://localhost:8000

# Environment
VITE_ENV=local

# Clerk Authentication
# Get these from https://dashboard.clerk.com/
CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here
CLERK_SECRET_KEY=your_clerk_secret_key_here

# Optional: Analytics
# VERCEL_ANALYTICS_ID=your_analytics_id_here
EOF
    
    echo "✅ Created .env file with default values"
    echo ""
    echo "⚠️  IMPORTANT: Update the following in .env:"
    echo "   - CLERK_PUBLISHABLE_KEY"
    echo "   - CLERK_SECRET_KEY"
    echo ""
    echo "   Get these from: https://dashboard.clerk.com/"
    echo ""
else
    echo "✅ .env file already exists"
    echo ""
fi

# Check if backend is running (optional)
echo "🔍 Checking if backend API is running..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:8000 | grep -q "200\|404"; then
    echo "✅ Backend API is running at http://localhost:8000"
else
    echo "⚠️  Backend API not detected at http://localhost:8000"
    echo "   Make sure to start the FastAPI backend before running the UI."
    echo "   See backend README for setup instructions."
fi
echo ""

# Success message
echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Update .env with your Clerk credentials"
echo "   2. Start the backend API (if not already running)"
echo "   3. Run: npm run dev"
echo "   4. Open: http://localhost:5173"
echo ""
echo "🛠️  Available commands:"
echo "   npm run dev        - Start development server"
echo "   npm run build      - Build for production"
echo "   npm run start      - Serve production build"
echo "   npm run typecheck  - Run TypeScript type checking"
echo ""
echo "📚 Documentation:"
echo "   - UI Skill: skill/SKILL.md"
echo "   - Components: skill/references/components.md"
echo "   - API Client: skill/references/api-client.md"
echo "   - Routing: skill/references/routing.md"
echo "   - State: skill/references/state-management.md"
echo "   - Styling: skill/references/styling.md"
echo ""
echo "Happy coding! 🎉"

