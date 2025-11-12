# SkaEV API Startup Script
# Run this script to start the backend API

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SkaEV Backend API - Starting...  " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if .NET SDK is installed
Write-Host "Checking .NET SDK..." -ForegroundColor Yellow
try {
    $dotnetVersion = dotnet --version
    Write-Host "✓ .NET SDK $dotnetVersion found" -ForegroundColor Green
} catch {
    Write-Host "✗ .NET SDK not found. Please install .NET 8.0 SDK" -ForegroundColor Red
    exit 1
}

# Navigate to API directory
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

# Check if csproj exists
if (-not (Test-Path "SkaEV.API.csproj")) {
    Write-Host "✗ SkaEV.API.csproj not found!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Restoring NuGet packages..." -ForegroundColor Yellow
dotnet restore

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Package restore failed" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Packages restored successfully" -ForegroundColor Green
Write-Host ""

Write-Host "Building project..." -ForegroundColor Yellow
dotnet build --no-restore

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Build failed" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Build successful" -ForegroundColor Green
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Starting API Server...  " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "API URLs:" -ForegroundColor Yellow
Write-Host "  HTTP:    http://localhost:5000" -ForegroundColor White
Write-Host "  HTTPS:   https://localhost:5001" -ForegroundColor White
Write-Host "  Swagger: http://localhost:5000 (root)" -ForegroundColor White
Write-Host "  Health:  http://localhost:5000/health" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Gray
Write-Host ""

# Run the API
dotnet run --no-build
