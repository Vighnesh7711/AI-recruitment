Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "  AuraRecruit AI Recruitment Platform Launcher (PS) " -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/5] Launching Node.js Backend API Server (Port 5000)..." -ForegroundColor Yellow
Start-Process cmd -ArgumentList '/k "npm run dev:server"' -NoNewWindow:$false

Write-Host "[2/5] Launching Vite Frontend Client (Port 5173)..." -ForegroundColor Yellow
Start-Process cmd -ArgumentList '/k "npm run dev:client"' -NoNewWindow:$false

Write-Host "[3/5] Launching Python AI Service (Port 8002)..." -ForegroundColor Yellow
Start-Process cmd -ArgumentList '/k "npm run dev:python"' -NoNewWindow:$false

Write-Host "[4/5] Launching Avatar Service (Port 5002)..." -ForegroundColor Yellow
Start-Process cmd -ArgumentList '/k "npm run dev:avatar"' -NoNewWindow:$false

Write-Host "[5/5] Launching n8n Workflow Server (Port 5678)..." -ForegroundColor Yellow
Start-Process cmd -ArgumentList '/k "set N8N_MCP_ENABLED=false&& set N8N_DIAGNOSTICS_ENABLED=false&& npx n8n start"' -NoNewWindow:$false


Write-Host ""
Write-Host "===================================================" -ForegroundColor Green
Write-Host "  All services have been launched in separate windows!" -ForegroundColor Green
Write-Host "===================================================" -ForegroundColor Green
