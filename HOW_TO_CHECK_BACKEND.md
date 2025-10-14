# 🔍 Hướng Dẫn Check Backend Status - SkaEV

## 📋 5 Cách Kiểm Tra Backend Có Chạy Không

### ✅ Phương Pháp 1: Check Ports (Nhanh nhất)

**PowerShell Command:**
```powershell
Get-NetTCPConnection -LocalPort 5001,5000 -State Listen -ErrorAction SilentlyContinue
```

**Expected Output (Backend đang chạy):**
```
LocalAddress LocalPort  State
------------ ---------  -----
::1               5001 Listen
127.0.0.1         5001 Listen
::1               5000 Listen
127.0.0.1         5000 Listen
```

**Nếu không có output** → Backend KHÔNG chạy

---

### ✅ Phương Pháp 2: Check Dotnet Processes

**PowerShell Command:**
```powershell
Get-Process | Where-Object { $_.ProcessName -eq "dotnet" } | 
Select-Object Id, ProcessName, StartTime, @{Name="Memory(MB)";Expression={[math]::Round($_.WorkingSet64/1MB,2)}}
```

**Expected Output:**
```
   Id ProcessName StartTime           Memory(MB)
   -- ----------- ---------           ----------
23284 dotnet      14/10/2025 07:41:23     170.17
```

**Nếu thấy processes với Memory ~100-200 MB** → Backend đang chạy

---

### ✅ Phương Pháp 3: Test Health Endpoint

**PowerShell Command:**
```powershell
Invoke-WebRequest -Uri "http://localhost:5000/health" -UseBasicParsing
```

**Expected Output:**
```
StatusCode        : 200
Content           : Healthy
```

**Hoặc test trong browser:**
- Mở: http://localhost:5000/health
- Thấy text "Healthy" → Backend OK

---

### ✅ Phương Pháp 4: Open Swagger UI (Trực quan nhất)

**Steps:**
1. Mở browser: **https://localhost:5001/swagger**
2. Nếu thấy SSL warning → Click **"Advanced" → "Proceed to localhost"**
3. Nếu thấy **Swagger UI** với danh sách endpoints → Backend đang chạy ✅
4. Thử click **GET /api/stations → "Try it out" → "Execute"**
5. Response status **200** với data 20 stations → API hoạt động ✅

**Screenshot:**
```
╔══════════════════════════════════════════════╗
║  SkaEV API v1                                ║
║  Electric Vehicle Charging Station API       ║
║                                              ║
║  ▼ Auth                                      ║
║    POST /api/auth/login                      ║
║    POST /api/auth/register                   ║
║                                              ║
║  ▼ Stations                                  ║
║    GET /api/stations                         ║
║    GET /api/stations/{id}                    ║
╚══════════════════════════════════════════════╝
```

---

### ✅ Phương Pháp 5: Check Backend Terminal Window

**Visual Check:**
1. Tìm PowerShell window có title **"SkaEV Backend API Server"**
2. Scroll lên đầu window
3. Tìm dòng text:
   ```
   Now listening on: https://localhost:5001
   Now listening on: http://localhost:5000
   Application started. Press Ctrl+C to shut down.
   ```
4. Nếu thấy → Backend đang chạy ✅
5. Nếu có errors màu đỏ → Backend có lỗi ❌

---

## 🚨 Backend KHÔNG Chạy - Cách Fix

### Tình huống 1: Không thấy terminal window

**Start backend manually:**
```powershell
cd SkaEV.API
dotnet run
```

**Đợi thấy:**
```
Building...
info: Microsoft.Hosting.Lifetime[14]
      Now listening on: https://localhost:5001
```

### Tình huống 2: Port đã được dùng

**Tìm và kill process:**
```powershell
# Tìm process đang dùng port 5001
Get-NetTCPConnection -LocalPort 5001 | Select-Object OwningProcess

# Kill process (thay <PID> bằng số thực tế)
Stop-Process -Id <PID> -Force

# Start backend lại
cd SkaEV.API
dotnet run
```

### Tình huống 3: SQL Server không chạy

**Backend error:**
```
Microsoft.Data.SqlClient.SqlException: A network-related error...
Cannot open database "SkaEV_DB"
```

**Fix:**
```powershell
# Start SQL Server
Start-Service -Name "MSSQLSERVER"

# Verify
Get-Service -Name "MSSQLSERVER"
```

### Tình huống 4: Database chưa deploy

**Backend error:**
```
Invalid object name 'charging_stations'
```

**Fix:**
```powershell
cd database
sqlcmd -S localhost -E -i DEPLOY_COMPLETE.sql
sqlcmd -S localhost -E -i INSERT_STATIONS_DATA.sql
```

---

## 🧪 Test Backend API Hoạt Động Đúng

### Test 1: Get All Stations
```powershell
Invoke-WebRequest -Uri "https://localhost:5001/api/stations" `
  -SkipCertificateCheck | Select-Object StatusCode, @{Name="ContentLength";Expression={$_.Content.Length}}
```

**Expected:**
```
StatusCode ContentLength
---------- -------------
       200         12345
```

### Test 2: Login API
```powershell
$body = @{
  email = "admin@skaev.com"
  password = "Admin123!"
} | ConvertTo-Json

Invoke-WebRequest -Uri "https://localhost:5001/api/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body `
  -SkipCertificateCheck
```

**Expected:** Status 200 với JWT token

### Test 3: Check Swagger JSON
```powershell
Invoke-WebRequest -Uri "https://localhost:5001/swagger/v1/swagger.json" `
  -SkipCertificateCheck | Select-Object StatusCode
```

**Expected:** StatusCode 200

---

## 📊 Complete Health Check Script

**Tạo file `check-backend.ps1`:**

```powershell
Write-Host "`n🔍 SkaEV Backend Health Check`n" -ForegroundColor Cyan

# 1. Check SQL Server
Write-Host "1. SQL Server Status:" -ForegroundColor Yellow
$sql = Get-Service -Name "MSSQLSERVER" -ErrorAction SilentlyContinue
if ($sql -and $sql.Status -eq "Running") {
    Write-Host "   ✅ Running" -ForegroundColor Green
} else {
    Write-Host "   ❌ Not running" -ForegroundColor Red
}

# 2. Check Ports
Write-Host "`n2. Backend Ports:" -ForegroundColor Yellow
$ports = Get-NetTCPConnection -LocalPort 5001,5000 -State Listen -ErrorAction SilentlyContinue
if ($ports) {
    Write-Host "   ✅ Ports 5000, 5001 listening" -ForegroundColor Green
} else {
    Write-Host "   ❌ Ports not listening" -ForegroundColor Red
}

# 3. Check Processes
Write-Host "`n3. Dotnet Processes:" -ForegroundColor Yellow
$procs = Get-Process | Where-Object { $_.ProcessName -eq "dotnet" }
if ($procs) {
    Write-Host "   ✅ $($procs.Count) process(es) running" -ForegroundColor Green
} else {
    Write-Host "   ❌ No processes found" -ForegroundColor Red
}

# 4. Test Health Endpoint
Write-Host "`n4. Health Endpoint:" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/health" -UseBasicParsing -TimeoutSec 3
    Write-Host "   ✅ Status: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# 5. Test Swagger
Write-Host "`n5. Swagger UI:" -ForegroundColor Yellow
try {
    [System.Net.ServicePointManager]::ServerCertificateValidationCallback = {$true}
    $response = Invoke-WebRequest -Uri "https://localhost:5001/swagger/v1/swagger.json" -UseBasicParsing -TimeoutSec 3
    Write-Host "   ✅ Accessible" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Not accessible" -ForegroundColor Red
}

# 6. Test API Endpoint
Write-Host "`n6. Stations API:" -ForegroundColor Yellow
try {
    [System.Net.ServicePointManager]::ServerCertificateValidationCallback = {$true}
    $response = Invoke-WebRequest -Uri "https://localhost:5001/api/stations" -UseBasicParsing -TimeoutSec 5
    $data = $response.Content | ConvertFrom-Json
    Write-Host "   ✅ $($data.Count) stations found" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n" -NoNewline
```

**Run:**
```powershell
.\check-backend.ps1
```

---

## 🎯 Quick Reference

| Check Method | Command | Good Sign |
|--------------|---------|-----------|
| **Ports** | `Get-NetTCPConnection -LocalPort 5001` | Has output |
| **Process** | `Get-Process dotnet` | Has processes |
| **Health** | `curl http://localhost:5000/health` | Returns "Healthy" |
| **Swagger** | Open browser → https://localhost:5001/swagger | Swagger UI loads |
| **Terminal** | Check PowerShell window | "Now listening on..." |

---

## 📞 Troubleshooting Commands

```powershell
# Restart backend
cd SkaEV.API
dotnet clean
dotnet build
dotnet run

# Kill all dotnet processes
Get-Process dotnet | Stop-Process -Force

# Start SQL Server
Start-Service MSSQLSERVER

# Check database
sqlcmd -S localhost -E -Q "SELECT COUNT(*) FROM SkaEV_DB.dbo.charging_stations"
```

---

**Created by**: SWP391_G4_Topic3  
**Date**: October 14, 2025  
**Version**: 1.0
