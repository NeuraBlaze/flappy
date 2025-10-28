@echo off
echo ============================================
echo        🐦 SZENYO-MADÁR JÁTÉK INDÍTÁSA
echo ============================================
echo.
echo A játék indítása...
echo Böngésző automatikusan megnyílik...
echo.
echo Leállításhoz: Ctrl+C és Y
echo ============================================
echo.

cd /d "%~dp0web"
start "" "http://localhost:8080"
python -m http.server 8080 2>nul || python3 -m http.server 8080 2>nul || (
    echo.
    echo ❌ HIBA: Python nem található!
    echo.
    echo Kérjük telepítsd a Python-t vagy használj másik módszert:
    echo 1. Node.js: npx serve . -p 8080
    echo 2. Bármilyen más web szerver
    echo.
    pause
)