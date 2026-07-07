@echo off
title AuraRecruit Launcher
echo ===================================================
echo   AuraRecruit AI Recruitment Platform Launcher
echo ===================================================
echo.

echo [1/5] Launching Node.js Backend API Server (Port 5000)...
start "AuraRecruit - Backend API" cmd /k "npm run dev:server"

echo [2/5] Launching Vite Frontend Client (Port 5173)...
start "AuraRecruit - Frontend Client" cmd /k "npm run dev:client"

echo [3/5] Launching Python AI Service (Port 8002)...
start "AuraRecruit - Python AI" cmd /k "npm run dev:python"

echo [4/5] Launching Avatar Service (Port 5002)...
start "AuraRecruit - Avatar Service" cmd /k "npm run dev:avatar"

echo [5/5] Launching n8n Workflow Server (Port 5678)...
start "AuraRecruit - n8n Workflows" cmd /k "npx n8n start"

echo.
echo ===================================================
echo   All services have been launched in separate windows!
echo   Close the respective window to stop a service.
echo ===================================================
echo.
pause
