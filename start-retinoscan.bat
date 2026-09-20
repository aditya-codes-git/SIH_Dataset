@echo off
setlocal enabledelayedexpansion

echo ==============================================================================
echo           RETINOSCAN AI — DIABETIC RETINOPATHY SCREENING SYSTEM
echo                     One-Click Local Startup (SIH 2026)
echo ==============================================================================
echo.

set "ROOT_DIR=%~dp0"
cd /d "%ROOT_DIR%"

:: 1. Verify Node.js
where node >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed or not found in system PATH.
    echo Please install Node.js v18+ LTS and try again.
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('node -v') do set "NODE_VER=%%v"
echo [CHECK] Node.js runtime detected: !NODE_VER!

:: 2. Verify npm
where npm >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm is not found in system PATH.
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('npm -v') do set "NPM_VER=%%v"
echo [CHECK] npm detected: !NPM_VER!

:: 3. Verify MATLAB
where matlab >nul 2>&1
if errorlevel 1 (
    echo [WARNING] 'matlab' command was not found directly in system PATH.
    echo RetinoScan backend will attempt to use configured MATLAB_CMD in backend\.env.
) else (
    echo [CHECK] MATLAB CLI executable found in system PATH.
)

:: 4. Verify Environment Files
if not exist "%ROOT_DIR%backend\.env" (
    echo [SETUP] backend\.env not found. Copying from backend\.env.example...
    copy "%ROOT_DIR%backend\.env.example" "%ROOT_DIR%backend\.env" >nul
)
if not exist "%ROOT_DIR%frontend\.env" (
    echo [SETUP] frontend\.env not found. Copying from frontend\.env.example...
    copy "%ROOT_DIR%frontend\.env.example" "%ROOT_DIR%frontend\.env" >nul
)

:: 5. Ensure Required Local Storage Directories Exist
if not exist "%ROOT_DIR%backend\uploads\original" mkdir "%ROOT_DIR%backend\uploads\original"
if not exist "%ROOT_DIR%backend\uploads\gradcam" mkdir "%ROOT_DIR%backend\uploads\gradcam"
if not exist "%ROOT_DIR%backend\uploads\results" mkdir "%ROOT_DIR%backend\uploads\results"
if not exist "%ROOT_DIR%backend\uploads\results\lesion_masks" mkdir "%ROOT_DIR%backend\uploads\results\lesion_masks"
echo [CHECK] Local storage directories verified: backend\uploads\

:: 6. Launch Backend API Bridge (Port 5000)
echo.
echo [START] Starting Backend API Bridge on port 5000...
start "RetinoScan-Backend" cmd /k "cd /d "%ROOT_DIR%backend" && echo Starting Backend Server... && npm start"

:: Wait 3 seconds for backend initialization
timeout /t 3 /nobreak >nul

:: 7. Launch Frontend Vite Server (Port 5173)
echo [START] Starting Frontend Vite Server on port 5173...
start "RetinoScan-Frontend" cmd /k "cd /d "%ROOT_DIR%frontend" && echo Starting Frontend Server... && npm run dev"

:: Wait 3 seconds for Vite server startup
timeout /t 3 /nobreak >nul

echo.
echo ==============================================================================
echo                        SERVICES ONLINE & RUNNING
echo ==============================================================================
echo  Frontend Application:   http://localhost:5173
echo  Backend Health Check:   http://localhost:5000/api/health
echo  Screenings Endpoint:    http://localhost:5000/api/screenings
echo.
echo  To stop all services, run: stop-retinoscan.bat
echo ==============================================================================
echo.

:: Open Browser to Local Frontend
start http://localhost:5173

exit /b 0
