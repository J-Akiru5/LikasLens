@echo off
REM LikasLens Backend Recovery Script for Windows
REM This script attempts to fix Laravel backend issues

echo.
echo ========================================
echo  LikasLens Backend Recovery Script
echo ========================================
echo.

REM Check if we're in the right directory
if not exist "apps\backend\composer.json" (
    echo ERROR: Please run this script from the LikasLens project root directory
    exit /b 1
)

echo [1/5] Checking PHP installation...
php --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: PHP is not installed or not in PATH
    echo Please install PHP 8.2+ and add it to your system PATH
    exit /b 1
)
echo ✓ PHP found

echo.
echo [2/5] Checking Composer installation...
composer --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Composer is not installed or not working
    echo Trying to install Composer...
    REM Optional: uncomment to auto-install composer
    REM curl -sS https://getcomposer.org/installer | php -- --install-dir=C:\PHP --filename=composer.exe
    echo Please visit: https://getcomposer.org/download/
    exit /b 1
)
echo ✓ Composer found

echo.
echo [3/5] Installing PHP dependencies...
cd apps\backend
composer install --no-interaction --prefer-dist
if errorlevel 1 (
    echo ERROR: Composer install failed
    echo Try running manually: cd apps\backend ^&^& composer install
    cd ..\..
    exit /b 1
)
cd ..\..
echo ✓ Dependencies installed

echo.
echo [4/5] Generating APP_KEY...
cd apps\backend
php artisan key:generate
cd ..\..
echo ✓ APP_KEY generated

echo.
echo [5/5] Running database migrations...
cd apps\backend
php artisan migrate --force
cd ..\..
echo ✓ Migrations complete

echo.
echo ========================================
echo  ✓ Backend recovery complete!
echo ========================================
echo.
echo You can now start the backend with:
echo   cd apps\backend
echo   php artisan serve --host=127.0.0.1 --port=8000
echo.
echo Or start all services with:
echo   pnpm dev
echo.

pause
