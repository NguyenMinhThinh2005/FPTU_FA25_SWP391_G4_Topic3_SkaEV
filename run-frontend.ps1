# =====================================================
# Script: Run Frontend - SkaEV Project
# =====================================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Starting SkaEV Frontend (Vite)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Di chuyển tới thư mục root (nơi có package.json)
$rootPath = $PSScriptRoot

if (-not (Test-Path (Join-Path $rootPath "package.json"))) {
    Write-Host "ERROR: package.json not found!" -ForegroundColor Red
    exit 1
}

Set-Location $rootPath

# Kiểm tra node_modules
if (-not (Test-Path (Join-Path $rootPath "node_modules"))) {
    Write-Host "node_modules not found. Running npm install..." -ForegroundColor Yellow
    npm install
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: npm install failed!" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "npm install completed successfully!" -ForegroundColor Green
    Write-Host ""
}

Write-Host "Starting Vite development server..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Frontend will be available at:" -ForegroundColor Green
Write-Host "  Local: http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop the server..." -ForegroundColor Yellow
Write-Host ""
Write-Host "----------------------------------------" -ForegroundColor Gray
Write-Host ""

# Chạy Vite dev server
npm run dev
