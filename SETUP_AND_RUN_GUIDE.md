# 🚀 Hướng Dẫn Setup và Chạy Hệ Thống SkaEV

## 📋 Mục Lục
1. [Yêu Cầu Hệ Thống](#yêu-cầu-hệ-thống)
2. [Cài Đặt Lần Đầu](#cài-đặt-lần-đầu)
3. [Chạy Hệ Thống](#chạy-hệ-thống)
4. [Kiểm Tra và Test](#kiểm-tra-và-test)
5. [Troubleshooting](#troubleshooting)

---

## 🔧 Yêu Cầu Hệ Thống

### Phần Mềm Cần Cài
- ✅ **SQL Server 2019+** (Express hoặc Developer Edition)
- ✅ **.NET SDK 8.0** hoặc mới hơn
- ✅ **Node.js 18+** và npm
- ✅ **Git** (để clone repository)
- ✅ **Visual Studio Code** hoặc IDE bất kỳ
- ✅ **SQL Server Management Studio (SSMS)** (recommended)

### Kiểm Tra Phiên Bản
```powershell
# Kiểm tra SQL Server
Get-Service -Name "MSSQLSERVER" | Select-Object Name, Status

# Kiểm tra .NET SDK
dotnet --version
# Expected: 8.0.x hoặc cao hơn

# Kiểm tra Node.js
node --version
# Expected: v18.x hoặc cao hơn

# Kiểm tra npm
npm --version
```

---

## 📥 Cài Đặt Lần Đầu

### Bước 1: Clone Repository (nếu chưa có)
```powershell
cd D:\University\SWP\
git clone https://github.com/NguyenMinhThinh2005/FPTU_FA25_SWP391_G4_Topic3_SkaEV.git
cd FPTU_FA25_SWP391_G4_Topic3_SkaEV
git checkout develop
```

### Bước 2: Setup Database

#### 2.1. Tạo Database và Schema
```powershell
# Chạy script deployment
cd database
sqlcmd -S localhost -E -i DEPLOY_COMPLETE.sql
```

**Hoặc dùng SSMS:**
1. Mở **SQL Server Management Studio**
2. Connect to SQL Server (localhost)
3. File → Open → File → chọn `database/DEPLOY_COMPLETE.sql`
4. Click **Execute (F5)**

#### 2.2. Insert Sample Data
```powershell
# Chạy script insert data
sqlcmd -S localhost -E -i INSERT_STATIONS_DATA.sql
```

**Hoặc dùng SSMS:**
1. Open file `database/INSERT_STATIONS_DATA.sql`
2. Click **Execute (F5)**
3. Xem kết quả: "✅ Sample data insertion completed successfully!"

#### 2.3. Verify Database
```sql
-- Chạy trong SSMS hoặc sqlcmd
USE SkaEV_DB;

-- Kiểm tra số lượng records
SELECT 'Stations' AS [Table], COUNT(*) AS [Count] FROM charging_stations
UNION ALL
SELECT 'Posts', COUNT(*) FROM charging_posts
UNION ALL
SELECT 'Slots', COUNT(*) FROM charging_slots;

-- Expected output:
-- Stations: 20
-- Posts: ~230
-- Slots: ~460
```

### Bước 3: Setup Backend (ASP.NET Core API)

```powershell
cd SkaEV.API

# Restore dependencies
dotnet restore

# Build project
dotnet build

# (Optional) Update connection string if needed
# Edit appsettings.json
```

**Kiểm tra `appsettings.json`:**
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=SkaEV_DB;Trusted_Connection=True;TrustServerCertificate=True;MultipleActiveResultSets=true"
  }
}
```

### Bước 4: Setup Frontend (React + Vite)

```powershell
# Quay về root directory
cd ..

# Install dependencies
npm install

# (Optional) Kiểm tra .env file
```

**Tạo file `.env` (nếu chưa có):**
```env
VITE_API_URL=https://localhost:5001/api
```

---

## ▶️ Chạy Hệ Thống

### Phương Pháp 1: Chạy Tự Động (PowerShell Script) ⭐ RECOMMENDED

#### Tạo script tự động:
Tạo file `start-all.ps1` trong root folder:

```powershell
# start-all.ps1
Write-Host "🚀 Starting SkaEV System..." -ForegroundColor Cyan
Write-Host ""

# Check SQL Server
Write-Host "1. Checking SQL Server..." -ForegroundColor Yellow
$sqlService = Get-Service -Name "MSSQLSERVER" -ErrorAction SilentlyContinue
if ($sqlService -and $sqlService.Status -eq "Running") {
    Write-Host "   ✓ SQL Server is running" -ForegroundColor Green
} else {
    Write-Host "   ✗ SQL Server is not running!" -ForegroundColor Red
    Write-Host "   Please start SQL Server first" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "2. Starting Backend API..." -ForegroundColor Yellow
$backendJob = Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd '$PSScriptRoot\SkaEV.API'; Write-Host '🔧 Backend API Server' -ForegroundColor Cyan; Write-Host 'Swagger: https://localhost:5001/swagger' -ForegroundColor Yellow; Write-Host 'API Base: https://localhost:5001/api' -ForegroundColor Yellow; Write-Host ''; dotnet run"
) -PassThru

Write-Host "   ✓ Backend starting in new window..." -ForegroundColor Green
Write-Host "   Waiting for backend to initialize..." -ForegroundColor Gray
Start-Sleep -Seconds 15

Write-Host ""
Write-Host "3. Starting Frontend Dev Server..." -ForegroundColor Yellow
$frontendJob = Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd '$PSScriptRoot'; Write-Host '🎨 Frontend Dev Server' -ForegroundColor Cyan; Write-Host 'Local: http://localhost:5173' -ForegroundColor Yellow; Write-Host ''; npm run dev"
) -PassThru

Write-Host "   ✓ Frontend starting in new window..." -ForegroundColor Green
Write-Host "   Waiting for frontend to initialize..." -ForegroundColor Gray
Start-Sleep -Seconds 10

Write-Host ""
Write-Host "4. Opening Browser..." -ForegroundColor Yellow
Start-Sleep -Seconds 2
Start-Process "http://localhost:5173"
Write-Host "   ✓ Browser opened" -ForegroundColor Green

Write-Host ""
Write-Host "✅ SkaEV System Started Successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📍 Access Points:" -ForegroundColor Cyan
Write-Host "   • Frontend:  http://localhost:5173" -ForegroundColor White
Write-Host "   • Backend:   https://localhost:5001" -ForegroundColor White
Write-Host "   • Swagger:   https://localhost:5001/swagger" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C to stop this script (servers will keep running)" -ForegroundColor Gray
Wait-Event
```

#### Chạy script:
```powershell
# Set execution policy (chỉ cần 1 lần)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Chạy script
.\start-all.ps1
```

### Phương Pháp 2: Chạy Thủ Công

#### Terminal 1: Backend API
```powershell
cd SkaEV.API
dotnet run
```

Đợi thấy message:
```
Now listening on: https://localhost:5001
Now listening on: http://localhost:5000
```

#### Terminal 2: Frontend Dev Server
```powershell
# Mở terminal mới
npm run dev
```

Đợi thấy message:
```
➜  Local:   http://localhost:5173/
```

#### Terminal 3: Mở Browser
```powershell
Start-Process "http://localhost:5173"
```

---

## ✅ Kiểm Tra và Test

### 1. Kiểm Tra Backend API

#### Test với Swagger UI:
1. Mở browser: **https://localhost:5001/swagger**
2. Nếu có cảnh báo SSL certificate → Click "Advanced" → "Proceed to localhost"
3. Thấy Swagger UI với các endpoints:
   - ✅ Auth (Login, Register, GetProfile)
   - ✅ Stations (GetAll, GetById, GetNearby)
   - ✅ Bookings (Create, Cancel, Complete)

#### Test API với curl:
```powershell
# Test health endpoint
Invoke-WebRequest -Uri "http://localhost:5000/health" -UseBasicParsing

# Test get all stations
Invoke-WebRequest -Uri "https://localhost:5001/api/stations" -SkipCertificateCheck | Select-Object -ExpandProperty Content
```

### 2. Kiểm Tra Frontend

#### Test Flow:
1. **Open**: http://localhost:5173
2. **Register**: Tạo account mới
   - Email: test@example.com
   - Password: Test@123
   - Full Name: Test User
3. **Login**: Đăng nhập với account vừa tạo
4. **View Stations**: Vào menu "Find Stations"
   - Phải thấy **20 trạm sạc**
   - Click vào từng trạm xem chi tiết
5. **Create Booking**: Đặt lịch sạc xe
6. **Check DevTools (F12)**:
   - Console tab: Không có errors
   - Network tab: API calls thành công (status 200)
   - Application → Local Storage: Có `token` và `user`

### 3. Kiểm Tra Database

```sql
-- Trong SSMS, chạy các queries test
USE SkaEV_DB;

-- Xem stations theo city
SELECT city, COUNT(*) AS station_count
FROM charging_stations
GROUP BY city
ORDER BY station_count DESC;

-- Xem posts theo loại
SELECT post_type, COUNT(*) AS post_count, AVG(power_output) AS avg_power_kw
FROM charging_posts
GROUP BY post_type;

-- Xem user vừa register
SELECT user_id, email, full_name, role, created_at
FROM users
ORDER BY created_at DESC;
```

---

## 🐛 Troubleshooting

### Lỗi 1: SQL Server không chạy
```powershell
# Khởi động SQL Server
Start-Service -Name "MSSQLSERVER"

# Kiểm tra status
Get-Service -Name "MSSQLSERVER"
```

### Lỗi 2: Backend không start (port đã được dùng)
```powershell
# Tìm process đang dùng port 5001
Get-NetTCPConnection -LocalPort 5001 | Select-Object OwningProcess
Get-Process -Id <PID> | Stop-Process -Force

# Hoặc thay đổi port trong appsettings.json
```

### Lỗi 3: Frontend không start (port 5173 busy)
```powershell
# Kill process trên port 5173
Get-NetTCPConnection -LocalPort 5173 | Select-Object OwningProcess
Get-Process -Id <PID> | Stop-Process -Force

# Hoặc npm run dev sẽ tự động chọn port khác (5174, 5175...)
```

### Lỗi 4: CORS Error
Kiểm tra `Program.cs` có config CORS đúng:
```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});
```

### Lỗi 5: API 404 Not Found
- ✅ Backend đã chạy? Check terminal
- ✅ URL đúng? `https://localhost:5001/api/...`
- ✅ Controller có `[Route("api/[controller]")]`?

### Lỗi 6: Database connection failed
Kiểm tra connection string:
```powershell
# Test connection
sqlcmd -S localhost -E -Q "SELECT @@VERSION"

# Nếu lỗi, check SQL Server Authentication mode
# Phải enable Mixed Mode Authentication
```

### Lỗi 7: npm install failed
```powershell
# Clear cache và reinstall
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm cache clean --force
npm install
```

### Lỗi 8: Git lock file exists
```powershell
Remove-Item ".git\index.lock" -Force
```

---

## 📊 System URLs Summary

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:5173 | React App (Vite Dev Server) |
| Backend API | https://localhost:5001/api | ASP.NET Core API |
| Swagger UI | https://localhost:5001/swagger | API Documentation |
| SQL Server | localhost | Database Server |
| Database | SkaEV_DB | Main Database |

---

## 🎯 Quick Commands Cheat Sheet

```powershell
# Start Everything
.\start-all.ps1

# Backend Only
cd SkaEV.API; dotnet run

# Frontend Only
npm run dev

# Database Scripts
cd database
sqlcmd -S localhost -E -i DEPLOY_COMPLETE.sql
sqlcmd -S localhost -E -i INSERT_STATIONS_DATA.sql

# Check Services
Get-Service MSSQLSERVER
Get-NetTCPConnection -LocalPort 5001,5173

# Git Operations
git pull origin develop
git status
git add .
git commit -m "message"
git push origin develop

# Clean Build
cd SkaEV.API
dotnet clean
dotnet build

# Clean Install
Remove-Item -Recurse node_modules
npm install
```

---

## 📞 Support

- **Documentation**: Check `database/README_INSERT_DATA.md`
- **API Reference**: Check `database/QUERY_REFERENCE.sql`
- **API Summary**: Check `API_CHECK_SUMMARY.md`

---

**Created by**: SWP391_G4_Topic3  
**Date**: October 14, 2025  
**Version**: 1.0
