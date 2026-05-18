@echo off
REM This script performs a clean reinstall of the project

echo 🔧 LikasLens Clean Install Script
echo ==================================

REM Step 1: Clean pnpm store
echo 📦 Cleaning pnpm store...
call pnpm store prune

REM Step 2: Remove node_modules directories
echo 🗑️  Removing node_modules...
if exist node_modules rmdir /s /q node_modules
if exist apps\frontend\node_modules rmdir /s /q apps\frontend\node_modules
if exist apps\backend\node_modules rmdir /s /q apps\backend\node_modules

REM Step 3: Clean build artifacts
echo 🧹 Cleaning build artifacts...
if exist apps\frontend\.next rmdir /s /q apps\frontend\.next
if exist apps\backend\build rmdir /s /q apps\backend\build

REM Step 4: Fresh install
echo 📥 Installing dependencies...
call pnpm install

REM Step 5: Test dev command  
echo 🚀 Testing dev server...
echo Frontend will start on http://localhost:3000
echo Backend (Vite) will start in parallel
call pnpm dev
