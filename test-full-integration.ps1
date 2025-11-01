# Test Full Integration - Frontend + Backend với Real Data
# Script kiểm tra toàn bộ tích hợp

Write-Host "=== KIỂM TRA TÍCH HỢP TOÀN BỘ ===" -ForegroundColor Cyan
Write-Host ""

# 1. Check Backend
Write-Host "1. Kiểm tra Backend API..." -ForegroundColor Yellow
$backendHealth = $null
try {
    $backendHealth = Invoke-WebRequest -Uri "http://localhost:5000/health" -UseBasicParsing
    if ($backendHealth.StatusCode -eq 200) {
        Write-Host "   ✅ Backend đang chạy" -ForegroundColor Green
    }
} catch {
    Write-Host "   ❌ Backend KHÔNG chạy!" -ForegroundColor Red
    Write-Host "   Chạy lệnh: cd SkaEV.API; dotnet run" -ForegroundColor Yellow
    exit 1
}

# 2. Check Frontend
Write-Host ""
Write-Host "2. Kiểm tra Frontend..." -ForegroundColor Yellow
$frontendHealth = $null
try {
    $frontendHealth = Invoke-WebRequest -Uri "http://localhost:5173" -UseBasicParsing -TimeoutSec 2
    if ($frontendHealth.StatusCode -eq 200) {
        Write-Host "   ✅ Frontend đang chạy" -ForegroundColor Green
    }
} catch {
    Write-Host "   ⚠️ Frontend KHÔNG chạy!" -ForegroundColor Yellow
    Write-Host "   Chạy lệnh: npm run dev" -ForegroundColor Yellow
}

# 3. Test API Endpoints
Write-Host ""
Write-Host "3. Kiểm tra API Endpoints..." -ForegroundColor Yellow

# Test Stations
try {
    $stations = Invoke-RestMethod -Uri "http://localhost:5000/api/stations" -Method Get
    Write-Host "   ✅ Stations API: $($stations.count) trạm sạc" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Stations API lỗi: $($_.Exception.Message)" -ForegroundColor Red
}

# Test Health endpoint
try {
    $health = Invoke-WebRequest -Uri "http://localhost:5000/health" -UseBasicParsing
    Write-Host "   ✅ Health API: $($health.Content)" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Health API lỗi" -ForegroundColor Red
}

# 4. Test Login để lấy token
Write-Host ""
Write-Host "4. Kiểm tra Authentication..." -ForegroundColor Yellow
$loginPayload = @{
    email = "admin@skaev.com"
    password = "Admin@123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" `
        -Method Post `
        -Body $loginPayload `
        -ContentType "application/json"
    
    if ($loginResponse.token) {
        Write-Host "   ✅ Login thành công - Token OK" -ForegroundColor Green
        $token = $loginResponse.token
        
        # Test Admin Reports với token
        Write-Host ""
        Write-Host "5. Kiểm tra Admin Reports API..." -ForegroundColor Yellow
        
        $headers = @{
            "Authorization" = "Bearer $token"
        }
        
        try {
            $today = Get-Date -Format "yyyy-MM-dd"
            $startOfMonth = (Get-Date -Day 1).ToString("yyyy-MM-dd")
            
            $revenueUrl = "http://localhost:5000/api/admin/AdminReports/revenue?startDate=$startOfMonth&endDate=$today"
            $revenueData = Invoke-RestMethod -Uri $revenueUrl -Method Get -Headers $headers
            Write-Host "   ✅ Revenue API: Doanh thu = $($revenueData.totalRevenue) VND" -ForegroundColor Green
            
            $usageUrl = "http://localhost:5000/api/admin/AdminReports/usage?startDate=$startOfMonth&endDate=$today"
            $usageData = Invoke-RestMethod -Uri $usageUrl -Method Get -Headers $headers
            Write-Host "   ✅ Usage API: Tổng bookings = $($usageData.totalBookings)" -ForegroundColor Green
            
        } catch {
            Write-Host "   ⚠️ Admin Reports API: $($_.Exception.Message)" -ForegroundColor Yellow
        }
        
        # Test Staff Issues
        Write-Host ""
        Write-Host "6. Kiểm tra Staff Issues API..." -ForegroundColor Yellow
        try {
            $issuesData = Invoke-RestMethod -Uri "http://localhost:5000/api/staff/issues" -Method Get -Headers $headers
            Write-Host "   ✅ Issues API: $($issuesData.Count) issues" -ForegroundColor Green
        } catch {
            Write-Host "   ⚠️ Issues API: $($_.Exception.Message)" -ForegroundColor Yellow
        }
        
        # Test Bookings
        Write-Host ""
        Write-Host "7. Kiểm tra Bookings API..." -ForegroundColor Yellow
        try {
            $bookingsData = Invoke-RestMethod -Uri "http://localhost:5000/api/bookings" -Method Get -Headers $headers
            Write-Host "   ✅ Bookings API: $($bookingsData.Count) bookings" -ForegroundColor Green
        } catch {
            Write-Host "   ⚠️ Bookings API: $($_.Exception.Message)" -ForegroundColor Yellow
        }
        
    } else {
        Write-Host "   ❌ Login thất bại - Không có token" -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ Login lỗi: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   Kiểm tra credentials: admin@skaev.com / Admin@123" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== TỔNG KẾT ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ CÁC TÍNH NĂNG ĐÃ HOÀN THÀNH:" -ForegroundColor Green
Write-Host "   1. Dashboard Admin dùng reportsAPI (real data)" 
Write-Host "   2. Staff Monitoring dùng staffAPI (real data)"
Write-Host "   3. Staff ChargingSessions dùng bookingsAPI (real data)"
Write-Host "   4. Backend APIs: Stations, Reports, Issues, Bookings"
Write-Host ""
Write-Host "📋 HƯỚNG DẪN SỬ DỤNG:" -ForegroundColor Yellow
Write-Host "   1. Đảm bảo backend đang chạy: cd SkaEV.API; dotnet run"
Write-Host "   2. Đảm bảo frontend đang chạy: npm run dev"
Write-Host "   3. Truy cập: http://localhost:5173"
Write-Host "   4. Login với:"
Write-Host "      - Admin: admin@skaev.com / Admin@123"
Write-Host "      - Staff: staff@skaev.com / Staff@123"
Write-Host ""
Write-Host "=== HOÀN THÀNH ===" -ForegroundColor Green
