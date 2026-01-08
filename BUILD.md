# Morty - Build Guide

Complete guide for building and deploying the Morty desktop application.

## Quick Start

### Build Portable App
```cmd
build-portable.bat
```
Creates a portable folder at `dist\morty-win32-x64\` that can be copied anywhere.

### Create Distribution Package
```cmd
create-portable-release.bat
```
Creates a complete release package with launcher and documentation.

## Build Methods

### Method 1: Simple Portable Build

**What it creates:** Folder containing all files needed to run Morty
**Best for:** Personal use, testing, development

**Steps:**
1. Double-click `build-portable.bat`
2. Wait for build to complete
3. Find your app in `dist\morty-win32-x64\`
4. Copy the folder anywhere and run `morty.exe`

**Manual command:**
```cmd
npm run package-portable
```

### Method 2: Distribution Package

**What it creates:** Professional package ready for sharing
**Best for:** Distributing to others, sharing online

**Steps:**
1. Run `create-portable-release.bat`
2. Find package in `Morty-Portable-Release\`
3. Zip the entire folder for distribution

**Contents:**
- `Morty\` - Complete portable app
- `Start Morty.bat` - Easy launcher
- `README.txt` - Documentation
- `QUICK-START.txt` - Simple instructions

## What You Get

✅ **True Desktop App** - No web browser needed  
✅ **Offline Operation** - Works completely offline  
✅ **Native Performance** - Fast, responsive experience  
✅ **Data Persistence** - All data saves automatically  
✅ **Custom Icon** - Professional Morty branding  
✅ **Portable** - Copy anywhere, no installation required  
✅ **Private** - All data stays on your computer  

## System Requirements

### Build Requirements (Development)
- **Windows**: 10 or later (64-bit)
- **Node.js**: Version 14+
- **Memory**: 4GB RAM minimum
- **Disk Space**: ~500MB for development

### Runtime Requirements (End Users)
- **Windows**: 10 or later (64-bit)
- **Memory**: 2GB RAM minimum
- **Disk Space**: ~200MB for app
- **No other dependencies** - Completely self-contained

## File Structure

```
MortgageAnalyser/
├── build/                     # Built React app
├── dist/
│   └── morty-win32-x64/      # Portable app folder
│       └── morty.exe         # Main executable
├── public/
│   ├── electron.js           # Desktop app main process
│   ├── morty-logo.png        # App logo (PNG)
│   └── morty-logo.ico        # App icon (ICO)
├── src/                      # Source code
├── build-portable.bat        # Build portable app
├── create-portable-release.bat # Create distribution package
└── package.json             # App configuration
```

## Distribution

### For Personal Use
1. Run `build-portable.bat`
2. Copy `dist\morty-win32-x64\` folder to desired location
3. Run `morty.exe` from the copied folder

### For Sharing with Others
1. Run `create-portable-release.bat`
2. Zip the `Morty-Portable-Release\` folder
3. Share the zip file
4. Recipients extract and run `Start Morty.bat`

### File Sizes
- **Portable folder:** ~150MB
- **Zipped distribution:** ~50MB
- **Memory usage:** ~100MB when running

## Troubleshooting

### Build Issues

**Build fails with errors:**
1. Ensure Node.js is installed: `node --version`
2. Install dependencies: `npm install`
3. Try manual build: `npm run build` then `npm run package-portable`

**Permission errors:**
1. Run Command Prompt as administrator
2. Navigate to project folder
3. Run build commands

**Antivirus interference:**
1. Add project folder to antivirus exclusions
2. Temporarily disable real-time protection during build
3. Windows Defender may quarantine files - restore them

### Runtime Issues

**App won't start:**
1. Check Windows version (requires Windows 10+)
2. Try running as administrator
3. Check antivirus hasn't blocked the executable

**Data not saving:**
- Data is stored in `%APPDATA%\morty\`
- This location persists even if you move the app folder
- Check folder permissions if issues persist

**Performance issues:**
- First launch may be slower (initializing)
- Subsequent launches are much faster
- Charts render with hardware acceleration

### Common Solutions

**Clear build cache:**
```cmd
rmdir /s /q node_modules
rmdir /s /q build
rmdir /s /q dist
npm install
```

**Reset to clean state:**
```cmd
git clean -fdx
npm install
```

## Development Commands

```cmd
# Start development server
npm start

# Build React app only
npm run build

# Run desktop app (development)
npm run electron-dev

# Run desktop app (production)
npm run build-electron

# Build portable app
npm run package-portable
```

## Security & Privacy

- **100% Local**: No internet connection required after build
- **Private Data**: All calculations stay on your computer
- **No Tracking**: No analytics, telemetry, or data collection
- **Secure**: Standard Electron security practices implemented
- **Portable**: No registry entries or system modifications

## Advanced Tips

### Custom Icon
The app uses `public/morty-logo.ico` for the executable icon. To change it:
1. Replace `public/morty-logo.ico` with your icon
2. Rebuild the portable app

### Code Signing (Optional)
To eliminate Windows security warnings:
1. Obtain a code signing certificate
2. Use electron-builder with certificate configuration
3. Sign the executable before distribution

### Automated Builds
For CI/CD or automated builds:
```cmd
npm ci
npm run package-portable
```

---

## Quick Reference

| Task | Command |
|------|---------|
| Build for personal use | `build-portable.bat` |
| Create distribution package | `create-portable-release.bat` |
| Manual build | `npm run package-portable` |
| Development mode | `npm run electron-dev` |
| Clean rebuild | Delete `node_modules`, `npm install` |

**Your mortgage and investment analysis tool is ready to deploy! 🚀**