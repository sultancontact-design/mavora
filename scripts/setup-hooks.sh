#!/bin/bash

# ===========================================
# Mavora - Setup Git Hooks (Husky)
# Run: npm run prepare or npx husky install
# ===========================================

set -e

echo "🔧 Setting up Git hooks with Husky..."

# Check if husky is installed
if ! command -v husky &> /dev/null; then
  echo "📦 Installing husky..."
  npm install --save-dev husky
fi

# Initialize husky
npx husky install 2>/dev/null || true

# Make hooks executable
chmod +x .husky/pre-commit .husky/commit-msg

echo "✅ Git hooks configured!"
echo ""
echo "Active hooks:"
echo "  • pre-commit  - Runs ESLint & Prettier"
echo "  • commit-msg  - Enforces conventional commits"
echo ""
echo "To bypass hooks (not recommended): git commit --no-verify"
