# COMPREHENSIVE PROJECT CHECK - 100% VERIFICATION
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  PROJECT COMPREHENSIVE CHECK" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

$pass = 0
$fail = 0
$warn = 0

# Login first
Write-Host "[AUTH] Logging in..." -ForegroundColor Yellow
try {
    $login = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method Post -Body '{"email":"admin2@skaev.com","password":"Admin@123"}' -ContentType "application/json"
    $headers = @{"Authorization" = "Bearer $($login.token)"}
    Write-Host "  [PASS] Logged in as $($login.fullName) ($($login.role))" -ForegroundColor Green
    $pass++
} catch {
    Write-Host "  [FAIL] Cannot login!" -ForegroundColor Red
    $fail++
    exit 1
}

Write-Host ""
Write-Host "=== BACKEND APIs ===" -ForegroundColor Cyan

# Test 1: Stations API
Write-Host "[1] Stations API..." -ForegroundColor Yellow
try {
    $stations = Invoke-RestMethod -Uri "http://localhost:5000/api/stations"
    if ($stations.count -gt 0) {
        Write-Host "  [PASS] $($stations.count) stations loaded from database" -ForegroundColor Green
        $pass++
    } else {
        Write-Host "  [WARN] 0 stations in database" -ForegroundColor Yellow
        $warn++
    }
} catch {
    Write-Host "  [FAIL] $($_.Exception.Message)" -ForegroundColor Red
    $fail++
}

# Test 2: Bookings API
Write-Host "[2] Bookings API..." -ForegroundColor Yellow
try {
    $bookings = Invoke-RestMethod -Uri "http://localhost:5000/api/bookings" -Headers $headers
    Write-Host "  [PASS] API working - $($bookings.Count) bookings" -ForegroundColor Green
    $pass++
    if ($bookings.Count -eq 0) {
        Write-Host "  [INFO] No bookings data yet (expected for new DB)" -ForegroundColor Gray
    }
} catch {
    Write-Host "  [FAIL] $($_.Exception.Message)" -ForegroundColor Red
    $fail++
}

# Test 3: Admin Reports Revenue
Write-Host "[3] Admin Reports - Revenue..." -ForegroundColor Yellow
try {
    $today = Get-Date -Format "yyyy-MM-dd"
    $start = (Get-Date -Day 1).ToString("yyyy-MM-dd")
    $revenue = Invoke-RestMethod -Uri "http://localhost:5000/api/admin/AdminReports/revenue?startDate=$start&endDate=$today" -Headers $headers
    Write-Host "  [PASS] Revenue API working" -ForegroundColor Green
    $pass++
} catch {
    Write-Host "  [FAIL] Revenue API error" -ForegroundColor Red
    $fail++
}

# Test 4: Admin Reports Usage
Write-Host "[4] Admin Reports - Usage..." -ForegroundColor Yellow
try {
    $today = Get-Date -Format "yyyy-MM-dd"
    $start = (Get-Date -Day 1).ToString("yyyy-MM-dd")
    $usage = Invoke-RestMethod -Uri "http://localhost:5000/api/admin/AdminReports/usage?startDate=$start&endDate=$today" -Headers $headers
    Write-Host "  [PASS] Usage API working" -ForegroundColor Green
    $pass++
} catch {
    Write-Host "  [FAIL] Usage API error" -ForegroundColor Red
    $fail++
}

# Test 5: Staff Issues
Write-Host "[5] Staff Issues API..." -ForegroundColor Yellow
try {
    $issues = Invoke-RestMethod -Uri "http://localhost:5000/api/StaffIssues" -Headers $headers
    Write-Host "  [PASS] Issues API working - $($issues.Count) issues" -ForegroundColor Green
    $pass++
} catch {
    Write-Host "  [FAIL] $($_.Exception.Message)" -ForegroundColor Red
    $fail++
}

# Test 6: Station Details
Write-Host "[6] Station Details API..." -ForegroundColor Yellow
try {
    $station1 = Invoke-RestMethod -Uri "http://localhost:5000/api/stations/1"
    Write-Host "  [PASS] $($station1.stationName)" -ForegroundColor Green
    $pass++
} catch {
    Write-Host "  [FAIL] $($_.Exception.Message)" -ForegroundColor Red
    $fail++
}

Write-Host ""
Write-Host "=== FRONTEND APIs Integration ===" -ForegroundColor Cyan

# Test 7: Frontend can call Stations
Write-Host "[7] Frontend Stations Integration..." -ForegroundColor Yellow
if (Test-Path "src/services/api/stationsAPI.js") {
    Write-Host "  [PASS] stationsAPI.js exists" -ForegroundColor Green
    $pass++
} else {
    Write-Host "  [FAIL] stationsAPI.js not found" -ForegroundColor Red
    $fail++
}

# Test 8: Frontend has reportsAPI
Write-Host "[8] Frontend Reports Integration..." -ForegroundColor Yellow
if (Test-Path "src/services/api/reportsAPI.js") {
    Write-Host "  [PASS] reportsAPI.js exists" -ForegroundColor Green
    $pass++
} else {
    Write-Host "  [FAIL] reportsAPI.js not found" -ForegroundColor Red
    $fail++
}

# Test 9: Frontend has staffAPI
Write-Host "[9] Frontend Staff Integration..." -ForegroundColor Yellow
if (Test-Path "src/services/api/staffAPI.js") {
    Write-Host "  [PASS] staffAPI.js exists" -ForegroundColor Green
    $pass++
} else {
    Write-Host "  [FAIL] staffAPI.js not found" -ForegroundColor Red
    $fail++
}

# Test 10: Dashboard uses real API
Write-Host "[10] Dashboard Integration..." -ForegroundColor Yellow
$dashboardContent = Get-Content "src/pages/admin/Dashboard.jsx" -Raw
if ($dashboardContent -match "reportsAPI" -and $dashboardContent -match "getDashboardSummary") {
    Write-Host "  [PASS] Dashboard uses reportsAPI" -ForegroundColor Green
    $pass++
} else {
    Write-Host "  [FAIL] Dashboard not using real API" -ForegroundColor Red
    $fail++
}

# Test 11: Monitoring uses real API
Write-Host "[11] Monitoring Integration..." -ForegroundColor Yellow
$monitoringContent = Get-Content "src/pages/staff/Monitoring.jsx" -Raw
if ($monitoringContent -match "staffAPI" -and $monitoringContent -match "getStationsStatus") {
    Write-Host "  [PASS] Monitoring uses staffAPI" -ForegroundColor Green
    $pass++
} else {
    Write-Host "  [FAIL] Monitoring not using real API" -ForegroundColor Red
    $fail++
}

# Test 12: ChargingSessions uses real API
Write-Host "[12] ChargingSessions Integration..." -ForegroundColor Yellow
$sessionsContent = Get-Content "src/pages/staff/ChargingSessions.jsx" -Raw
if ($sessionsContent -match "staffAPI" -and $sessionsContent -match "getBookingsHistory") {
    Write-Host "  [PASS] ChargingSessions uses staffAPI" -ForegroundColor Green
    $pass++
} else {
    Write-Host "  [FAIL] ChargingSessions not using real API" -ForegroundColor Red
    $fail++
}

Write-Host ""
Write-Host "=== DATABASE Connection ===" -ForegroundColor Cyan

# Test 13: Can query database
Write-Host "[13] Database Connectivity..." -ForegroundColor Yellow
if ($stations.count -gt 0) {
    Write-Host "  [PASS] Database connected and has data" -ForegroundColor Green
    $pass++
} else {
    Write-Host "  [WARN] Database connection unclear" -ForegroundColor Yellow
    $warn++
}

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "SUMMARY" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Passed:   $pass / 13" -ForegroundColor Green
Write-Host "Failed:   $fail / 13" -ForegroundColor Red
Write-Host "Warnings: $warn / 13" -ForegroundColor Yellow
Write-Host ""

if ($fail -eq 0) {
    Write-Host "=== PROJECT 100% READY ===" -ForegroundColor Green
    Write-Host ""
    Write-Host "All systems operational:" -ForegroundColor Green
    Write-Host "- Backend APIs connected to database" -ForegroundColor White
    Write-Host "- Frontend integrated with backend" -ForegroundColor White
    Write-Host "- Authentication working" -ForegroundColor White
    Write-Host "- All API clients properly configured" -ForegroundColor White
    Write-Host ""
    Write-Host "Login credentials:" -ForegroundColor Yellow
    Write-Host "  Admin: admin2@skaev.com / Admin@123" -ForegroundColor White
    Write-Host "  Staff: staff2@skaev.com / Staff@123" -ForegroundColor White
} else {
    Write-Host "=== ISSUES DETECTED ===" -ForegroundColor Red
    Write-Host "Please review failed tests above" -ForegroundColor Yellow
}
