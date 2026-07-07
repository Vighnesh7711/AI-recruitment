@echo off
title AuraRecruit Installer
echo ===================================================
echo   AuraRecruit Monorepo Dependency Setup Script
echo ===================================================
echo.

echo [1/4] Installing Root and Workspace Node Modules...
call npm install
if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] npm install failed. Please ensure Node.js is installed.
    pause
    exit /b %ERRORLEVEL%
)

echo [2/4] Setting up Python Virtual Environment (FastAPI AI service)...
cd python-ai
if not exist venv (
    python -m venv venv
)
if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] Python virtual environment creation failed. Make sure Python 3 is installed.
    cd ..
    pause
    exit /b %ERRORLEVEL%
)

echo [3/4] Installing Python requirements...
call .\venv\Scripts\pip install -r requirements.txt
if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] Failed to install Python packages. Check python-ai/requirements.txt.
    cd ..
    pause
    exit /b %ERRORLEVEL%
)
cd ..

echo [4/4] Generating default .env files if they do not exist...
if not exist client\.env (
    copy client\.env.example client\.env >nul
    echo Created client\.env from example.
) else (
    echo client\.env already exists.
)

if not exist server\.env (
    copy server\.env.example server\.env >nul
    echo Created server\.env from example.
) else (
    echo server\.env already exists.
)

if not exist python-ai\.env (
    echo APP_ENV=development> python-ai\.env
    echo GEMINI_API_KEY=your_gemini_api_key_here>> python-ai\.env
    echo SERVER_URL=http://localhost:5000>> python-ai\.env
    echo PORT=8002>> python-ai\.env
    echo Created python-ai\.env with defaults.
) else (
    echo python-ai\.env already exists.
)

if not exist avatar-service\.env (
    echo NODE_ENV=development> avatar-service\.env
    echo PORT=5002>> avatar-service\.env
    echo SERVER_URL=http://localhost:5000>> avatar-service\.env
    echo GEMINI_API_KEY=your_gemini_api_key_here>> avatar-service\.env
    echo CLIENT_URL=http://localhost:5173>> avatar-service\.env
    echo Created avatar-service\.env with defaults.
) else (
    echo avatar-service\.env already exists.
)

echo.
echo ===================================================
echo   Setup Completed Successfully!
echo   1. Please update keys (MongoDB, Gemini, Cloudinary) in .env files.
echo   2. Run 'start-all.bat' to launch the platform.
echo ===================================================
echo.
pause
