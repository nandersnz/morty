@echo off
echo Building Morty Portable App...
echo.

echo Step 1: Building React app...
call npm run build
if %errorlevel% neq 0 (
    echo React build failed!
    pause
    exit /b 1
)

echo.
echo Step 2: Cleaning previous builds...
if exist "dist\morty-win32-x64" rmdir /s /q "dist\morty-win32-x64"

echo.
echo Step 3: Creating portable package...
call npm run package-portable
if %errorlevel% neq 0 (
    echo Package creation failed!
    pause
    exit /b 1
)

echo.
echo SUCCESS! Portable app created!
echo.
echo Location: dist\morty-win32-x64\
echo.
echo To use:
echo 1. Copy the entire "morty-win32-x64" folder anywhere
echo 2. Run "morty.exe" from that folder
echo 3. No installation required!
echo.
pause