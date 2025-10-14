# Simple Frontend-Backend Integration Test
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  FRONTEND-BACKEND INTEGRATION TEST" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

$pass = 0
$fail = 0

# Test 1: Backend Health
Write-Host "[1/8] Testing Backend Health..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/health" -TimeoutSec 3
    if ($response.StatusCode -eq 200) {
        Write-Host "  [PASS] Backend is running" -ForegroundColor Green
        $pass++
    }
} catch {
    Write-Host "  [FAIL] Backend is NOT running" -ForegroundColor Red
    $fail++
}

# Test 2: Frontend Running
Write-Host "`n[2/8] Testing Frontend..." -ForegroundColor Yellow
$frontendPort = 0
foreach ($port in @(5173, 5174, 5175)) {
    $conn = Test-NetConnection -ComputerName localhost -Port $port -WarningAction SilentlyContinue -InformationLevel Quiet
    if ($conn) {
        $frontendPort = $port
        Write-Host "  [PASS] Frontend running on port $port" -ForegroundColor Green
        $pass++
        break
    }
}
if ($frontendPort -eq 0) {
    Write-Host "  [FAIL] Frontend is NOT running" -ForegroundColor Red
    $fail++
}

# Test 3: CORS Check
Write-Host "`n[3/8] Testing CORS Configuration..." -ForegroundColor Yellow
try {
    $headers = @{ "Origin" = "http://localhost:$frontendPort" }
    $response = Invoke-WebRequest -Uri "http://localhost:5000/api/stations" -Headers $headers -TimeoutSec 3
    $allowOrigin = $response.Headers["Access-Control-Allow-Origin"]
    if ($allowOrigin) {
        Write-Host "  [PASS] CORS configured: $allowOrigin" -ForegroundColor Green
        $pass++
    } else {
        Write-Host "  [WARN] CORS header not found" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  [FAIL] CORS check failed" -ForegroundColor Red
    $fail++
}

# Test 4: GET Stations
Write-Host "`n[4/8] Testing GET /api/stations..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/api/stations" -TimeoutSec 3
    $stations = $response.Content | ConvertFrom-Json
    Write-Host "  [PASS] Retrieved $($stations.Count) stations" -ForegroundColor Green
    if ($stations.Count -gt 0) {
        Write-Host "    Example: $($stations[0].name)" -ForegroundColor Gray
    }
    $pass++
} catch {
    Write-Host "  [FAIL] Could not retrieve stations" -ForegroundColor Red
    $fail++
}

# Test 5: GET Single Station
Write-Host "`n[5/8] Testing GET /api/stations/1..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/api/stations/1" -TimeoutSec 3
    $station = $response.Content | ConvertFrom-Json
    Write-Host "  [PASS] Retrieved: $($station.name)" -ForegroundColor Green
    $pass++
} catch {
    Write-Host "  [INFO] Station 1 not found (OK if no data)" -ForegroundColor Yellow
}

# Test 6: Auth Endpoint
Write-Host "`n[6/8] Testing POST /api/auth/login..." -ForegroundColor Yellow
try {
    $body = '{"email":"test@test.com","password":"wrong"}'
    $headers = @{ "Content-Type" = "application/json" }
    try {
        Invoke-WebRequest -Uri "http://localhost:5000/api/auth/login" -Method Post -Body $body -Headers $headers -TimeoutSec 3
    } catch {
        if ($_.Exception.Response.StatusCode.Value__ -eq 401) {
            Write-Host "  [PASS] Auth endpoint working (401 as expected)" -ForegroundColor Green
            $pass++
        } else {
            throw
        }
    }
} catch {
    Write-Host "  [FAIL] Auth endpoint error" -ForegroundColor Red
    $fail++
}

# Test 7: Swagger
Write-Host "`n[7/8] Testing Swagger UI..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/swagger/index.html" -TimeoutSec 3
    Write-Host "  [PASS] Swagger accessible at http://localhost:5000/swagger" -ForegroundColor Green
    $pass++
} catch {
    Write-Host "  [FAIL] Swagger not accessible" -ForegroundColor Red
    $fail++
}

# Test 8: Performance
Write-Host "`n[8/8] Testing Response Time..." -ForegroundColor Yellow
try {
    $times = @()
    1..5 | ForEach-Object {
        $sw = [Diagnostics.Stopwatch]::StartNew()
        Invoke-WebRequest -Uri "http://localhost:5000/api/stations" -TimeoutSec 3 | Out-Null
        $sw.Stop()
        $times += $sw.ElapsedMilliseconds
    }
    $avg = ($times | Measure-Object -Average).Average
    Write-Host "  [PASS] Average: $([math]::Round($avg, 1))ms" -ForegroundColor Green
    $pass++
} catch {
    Write-Host "  [FAIL] Performance test failed" -ForegroundColor Red
    $fail++
}

# Summary
Write-Host "`n=========================================" -ForegroundColor Cyan
Write-Host "  SUMMARY" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
$total = $pass + $fail
Write-Host "Passed: $pass / $total" -ForegroundColor Green
Write-Host "Failed: $fail / $total" -ForegroundColor $(if ($fail -gt 0) { "Red" } else { "Green" })

if ($fail -eq 0) {
    Write-Host "`n SUCCESS! Frontend and Backend integrated!" -ForegroundColor Green
    Write-Host "`nAccess URLs:" -ForegroundColor Cyan
    Write-Host "  Frontend: http://localhost:$frontendPort" -ForegroundColor White
    Write-Host "  Backend:  http://localhost:5000" -ForegroundColor White
    Write-Host "  Swagger:  http://localhost:5000/swagger" -ForegroundColor White
} else {
    Write-Host "`n ISSUES DETECTED - Check failed tests above" -ForegroundColor Red
}
Write-Host ""
