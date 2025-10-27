@echo off
echo.
echo ========================================
echo   🐦 HARASZT FLAPPY - LOCAL EDITION
echo ========================================
echo.
echo Starting local web server...
echo Game will open at: http://localhost:8080
echo.
echo Press Ctrl+C to stop the server
echo.

cd /d "%~dp0"

if exist "web\index.html" (
    echo Starting server...
    python -m http.server 8080 --directory web
    if errorlevel 1 (
        echo.
        echo Python not found, trying alternative...
        powershell -Command "Start-Process 'http://localhost:8080'; python -m http.server 8080 --directory web"
    )
) else (
    echo ERROR: Game files not found!
    echo Please make sure the 'web' folder exists.
    pause
)

pause