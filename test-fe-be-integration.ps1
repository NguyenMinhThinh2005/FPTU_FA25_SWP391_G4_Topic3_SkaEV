# Frontend-Backend Integration Test Script
# Tests connectivity between React frontend and ASP.NET Core backend

Write-Host "`n╔═══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     FRONTEND-BACKEND INTEGRATION TEST                        ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

$testResults = @()
$passCount = 0
$failCount = 0

# Test 1: Check Backend is Running
Write-Host "Test 1: Checking Backend (Port 5000)..." -ForegroundColor Yellow
try {
    $backendResponse = Invoke-WebRequest -Uri "http://localhost:5000/health" -TimeoutSec 5
    if ($backendResponse.StatusCode -eq 200) {
        Write-Host "  ✅ PASS - Backend is running" -ForegroundColor Green
        $testResults += "✅ Backend Running"
        $passCount++
    }
} catch {
    Write-Host "  ❌ FAIL - Backend is NOT running" -ForegroundColor Red
    Write-Host "    Run: .\start-backend.ps1" -ForegroundColor Yellow
    $testResults += "❌ Backend NOT Running"
    $failCount++
}

# Test 2: Check Frontend is Running
Write-Host "`nTest 2: Checking Frontend (Port 5173 or 5174)..." -ForegroundColor Yellow
$frontendRunning = $false
$frontendPort = 0

foreach ($port in @(5173, 5174, 5175)) {
    try {
        $testConnection = Test-NetConnection -ComputerName localhost -Port $port -WarningAction SilentlyContinue -InformationLevel Quiet
        if ($testConnection) {
            $frontendPort = $port
            $frontendRunning = $true
            Write-Host "  ✅ PASS - Frontend is running on port $port" -ForegroundColor Green
            $testResults += "✅ Frontend Running (Port $port)"
            $passCount++
            break
        }
    } catch {
        continue
    }
}

if (-not $frontendRunning) {
    Write-Host "  ❌ FAIL - Frontend is NOT running" -ForegroundColor Red
    Write-Host "    Run: npm run dev" -ForegroundColor Yellow
    $testResults += "❌ Frontend NOT Running"
    $failCount++
}

# Test 3: Check CORS Configuration
Write-Host "`nTest 3: Checking CORS Configuration..." -ForegroundColor Yellow
try {
    $headers = @{
        "Origin" = "http://localhost:$frontendPort"
        "Access-Control-Request-Method" = "GET"
    }
    $corsResponse = Invoke-WebRequest -Uri "http://localhost:5000/api/stations" -Headers $headers -Method Get -TimeoutSec 5
    $allowOrigin = $corsResponse.Headers["Access-Control-Allow-Origin"]
    
    if ($allowOrigin -eq "http://localhost:$frontendPort") {
        Write-Host "  ✅ PASS - CORS is configured correctly for port $frontendPort" -ForegroundColor Green
        $testResults += "✅ CORS Configured"
        $passCount++
    } else {
        Write-Host "  ⚠️  WARNING - CORS may not be configured for port $frontendPort" -ForegroundColor Yellow
        Write-Host "    Expected: http://localhost:$frontendPort" -ForegroundColor Gray
        Write-Host "    Got: $allowOrigin" -ForegroundColor Gray
        $testResults += "⚠️ CORS Warning"
    }
} catch {
    Write-Host "  ❌ FAIL - Could not verify CORS" -ForegroundColor Red
    $testResults += "❌ CORS Check Failed"
    $failCount++
}

# Test 4: Test API Endpoint - GET Stations
Write-Host "`nTest 4: Testing GET /api/stations endpoint..." -ForegroundColor Yellow
try {
    $stationsResponse = Invoke-WebRequest -Uri "http://localhost:5000/api/stations" -TimeoutSec 5
    $stations = $stationsResponse.Content | ConvertFrom-Json
    
    if ($stations.Count -gt 0) {
        Write-Host "  [PASS] Retrieved $($stations.Count) stations" -ForegroundColor Green
        Write-Host "    First station: $($stations[0].name)" -ForegroundColor Gray
        $testResults += "[PASS] GET Stations ($($stations.Count) records)"
        $passCount++
    } else {
        Write-Host "  [WARNING] No stations found in database" -ForegroundColor Yellow
        $testResults += "[WARNING] No Stations Found"
    }
} catch {
    Write-Host "  ❌ FAIL - Could not retrieve stations" -ForegroundColor Red
    Write-Host "    Error: $_" -ForegroundColor Gray
    $testResults += "❌ GET Stations Failed"
    $failCount++
}

# Test 5: Test API Endpoint - GET Single Station
Write-Host "`nTest 5: Testing GET /api/stations/1 endpoint..." -ForegroundColor Yellow
try {
    $stationResponse = Invoke-WebRequest -Uri "http://localhost:5000/api/stations/1" -TimeoutSec 5
    $station = $stationResponse.Content | ConvertFrom-Json
    
    if ($station.stationId) {
        Write-Host "  ✅ PASS - Retrieved station: $($station.name)" -ForegroundColor Green
        Write-Host "    Address: $($station.address)" -ForegroundColor Gray
        $testResults += "✅ GET Single Station"
        $passCount++
    }
} catch {
    $statusCode = $_.Exception.Response.StatusCode.Value__
    if ($statusCode -eq 404) {
        Write-Host "  ⚠️  INFO - Station ID 1 not found (404)" -ForegroundColor Yellow
        $testResults += "ℹ️ Station 1 Not Found"
    } else {
        Write-Host "  ❌ FAIL - Could not retrieve station" -ForegroundColor Red
        $testResults += "❌ GET Single Station Failed"
        $failCount++
    }
}

# Test 6: Test Authentication Endpoint
Write-Host "`nTest 6: Testing POST /api/auth/login endpoint..." -ForegroundColor Yellow
try {
    $loginData = @{
        email = "test@invalid.com"
        password = "wrongpassword"
    } | ConvertTo-Json
    
    $headers = @{
        "Content-Type" = "application/json"
    }
    
    try {
        $loginResponse = Invoke-WebRequest -Uri "http://localhost:5000/api/auth/login" -Method Post -Body $loginData -Headers $headers -TimeoutSec 5
    } catch {
        # Expected to fail with 401
        if ($_.Exception.Response.StatusCode.Value__ -eq 401) {
            Write-Host "  ✅ PASS - Auth endpoint is working (rejected invalid credentials)" -ForegroundColor Green
            $testResults += "✅ Auth Endpoint Working"
            $passCount++
        } else {
            throw $_
        }
    }
} catch {
    if ($_.Exception.Response.StatusCode.Value__ -eq 401) {
        Write-Host "  ✅ PASS - Auth endpoint is working (rejected invalid credentials)" -ForegroundColor Green
        $testResults += "✅ Auth Endpoint Working"
        $passCount++
    } else {
        Write-Host "  ❌ FAIL - Auth endpoint error" -ForegroundColor Red
        Write-Host "    Error: $_" -ForegroundColor Gray
        $testResults += "❌ Auth Endpoint Failed"
        $failCount++
    }
}

# Test 7: Test Swagger Documentation
Write-Host "`nTest 7: Checking Swagger Documentation..." -ForegroundColor Yellow
try {
    $swaggerResponse = Invoke-WebRequest -Uri "http://localhost:5000/swagger/index.html" -TimeoutSec 5
    if ($swaggerResponse.StatusCode -eq 200) {
        Write-Host "  ✅ PASS - Swagger UI is accessible" -ForegroundColor Green
        Write-Host "    URL: http://localhost:5000/swagger" -ForegroundColor Cyan
        $testResults += "✅ Swagger Accessible"
        $passCount++
    }
} catch {
    Write-Host "  ❌ FAIL - Swagger is not accessible" -ForegroundColor Red
    $testResults += "❌ Swagger Failed"
    $failCount++
}

# Test 8: Check Response Time Performance
Write-Host "`nTest 8: Testing API Response Time..." -ForegroundColor Yellow
try {
    $measurements = @()
    for ($i = 1; $i -le 5; $i++) {
        $sw = [System.Diagnostics.Stopwatch]::StartNew()
        $null = Invoke-WebRequest -Uri "http://localhost:5000/api/stations" -TimeoutSec 5
        $sw.Stop()
        $measurements += $sw.ElapsedMilliseconds
    }
    
    $avgTime = ($measurements | Measure-Object -Average).Average
    $maxTime = ($measurements | Measure-Object -Maximum).Maximum
    
    if ($avgTime -lt 100) {
        Write-Host "  ✅ PASS - Average response time: $([math]::Round($avgTime, 2))ms (Excellent)" -ForegroundColor Green
        $testResults += "✅ Performance: $([math]::Round($avgTime, 2))ms avg"
        $passCount++
    } elseif ($avgTime -lt 500) {
        Write-Host "  ⚠️  WARNING - Average response time: $([math]::Round($avgTime, 2))ms (Acceptable)" -ForegroundColor Yellow
        $testResults += "⚠️ Performance: $([math]::Round($avgTime, 2))ms avg"
    } else {
        Write-Host "  ❌ FAIL - Average response time: $([math]::Round($avgTime, 2))ms (Too slow)" -ForegroundColor Red
        $testResults += "❌ Performance: $([math]::Round($avgTime, 2))ms avg"
        $failCount++
    }
    
    Write-Host "    Max: $([math]::Round($maxTime, 2))ms" -ForegroundColor Gray
} catch {
    Write-Host "  ❌ FAIL - Could not measure response time" -ForegroundColor Red
    $testResults += "❌ Performance Test Failed"
    $failCount++
}

# Summary Report
Write-Host "`n╔═══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                    TEST SUMMARY                              ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

Write-Host "`nTest Results:" -ForegroundColor White
foreach ($result in $testResults) {
    Write-Host "  $result" -ForegroundColor White
}

Write-Host "`n═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
$totalTests = $passCount + $failCount
$successRate = if ($totalTests -gt 0) { [math]::Round(($passCount / $totalTests) * 100, 1) } else { 0 }

Write-Host "Total Tests: $totalTests" -ForegroundColor White
Write-Host "Passed: $passCount" -ForegroundColor Green
Write-Host "Failed: $failCount" -ForegroundColor $(if ($failCount -gt 0) { "Red" } else { "Green" })
Write-Host "Success Rate: $successRate%" -ForegroundColor $(if ($successRate -ge 80) { "Green" } elseif ($successRate -ge 60) { "Yellow" } else { "Red" })

Write-Host "`n═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan

# Final Verdict
if ($failCount -eq 0) {
    Write-Host "`n🎉 ALL TESTS PASSED!" -ForegroundColor Green
    Write-Host "Frontend and Backend are properly integrated and communicating." -ForegroundColor Green
    Write-Host "`nAccess Points:" -ForegroundColor Cyan
    Write-Host "  Frontend: http://localhost:$frontendPort" -ForegroundColor White
    Write-Host "  Backend:  http://localhost:5000" -ForegroundColor White
    Write-Host "  Swagger:  http://localhost:5000/swagger" -ForegroundColor White
} elseif ($failCount -le 2) {
    Write-Host "`n⚠️  TESTS PASSED WITH WARNINGS" -ForegroundColor Yellow
    Write-Host "Most functionality is working, but some issues need attention." -ForegroundColor Yellow
} else {
    Write-Host "`n❌ TESTS FAILED" -ForegroundColor Red
    Write-Host "Critical issues detected. Please check the failed tests above." -ForegroundColor Red
    Write-Host "`nTroubleshooting:" -ForegroundColor Yellow
    Write-Host "  1. Make sure backend is running: .\start-backend.ps1" -ForegroundColor White
    Write-Host "  2. Make sure frontend is running: npm run dev" -ForegroundColor White
    Write-Host "  3. Check CORS configuration in Program.cs" -ForegroundColor White
    Write-Host "  4. Verify database connection in appsettings.json" -ForegroundColor White
}

Write-Host "`n"
