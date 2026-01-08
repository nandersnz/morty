@echo off
echo Creating Morty Portable Release Package...
echo.

REM Build the portable app
echo Step 1: Building portable app...
call npm run package-portable
if %errorlevel% neq 0 (
    echo Build failed!
    pause
    exit /b 1
)

REM Create release folder
echo.
echo Step 2: Creating release package...
set RELEASE_DIR=Morty-Portable-Release
if exist "%RELEASE_DIR%" rmdir /s /q "%RELEASE_DIR%"
mkdir "%RELEASE_DIR%"

REM Copy portable app
xcopy "dist\morty-win32-x64" "%RELEASE_DIR%\Morty" /E /I /Q

REM Create launcher script in release folder
echo @echo off > "%RELEASE_DIR%\Start Morty.bat"
echo echo Starting Morty... >> "%RELEASE_DIR%\Start Morty.bat"
echo cd /d "%%~dp0\Morty" >> "%RELEASE_DIR%\Start Morty.bat"
echo start morty.exe >> "%RELEASE_DIR%\Start Morty.bat"

REM Copy documentation
copy "README.md" "%RELEASE_DIR%\README.txt" >nul

REM Create simple instructions
echo # Morty Portable - Quick Start > "%RELEASE_DIR%\QUICK-START.txt"
echo. >> "%RELEASE_DIR%\QUICK-START.txt"
echo 1. Double-click "Start Morty.bat" to launch the app >> "%RELEASE_DIR%\QUICK-START.txt"
echo 2. Or go into the "Morty" folder and run "morty.exe" directly >> "%RELEASE_DIR%\QUICK-START.txt"
echo. >> "%RELEASE_DIR%\QUICK-START.txt"
echo No installation required! >> "%RELEASE_DIR%\QUICK-START.txt"
echo Works on any Windows 10+ computer. >> "%RELEASE_DIR%\QUICK-START.txt"

echo.
echo SUCCESS! Portable release created in: %RELEASE_DIR%\
echo.
pause