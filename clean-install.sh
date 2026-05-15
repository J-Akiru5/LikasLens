#!/bin/bash
# This script performs a clean reinstall of the project

echo "🔧 LikasLens Clean Install Script"
echo "=================================="

# Step 1: Clean pnpm store
echo "📦 Cleaning pnpm store..."
pnpm store prune

# Step 2: Remove node_modules directories
echo "🗑️  Removing node_modules..."
rm -rf node_modules
rm -rf apps/*/node_modules

# Step 3: Clean build artifacts
echo "🧹 Cleaning build artifacts..."
rm -rf apps/frontend/.next
rm -rf apps/backend/build

# Step 4: Fresh install
echo "📥 Installing dependencies..."
pnpm install

# Step 5: Test dev command
echo "🚀 Testing dev server..."
echo "Frontend will start on http://localhost:3000"
echo "Backend (Vite) will start in parallel"
pnpm dev
