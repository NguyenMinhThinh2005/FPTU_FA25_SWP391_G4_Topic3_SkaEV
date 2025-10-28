# Test toggle station status API

Write-Host "`n=== Testing Station Status Toggle ===" -ForegroundColor Cyan

# Step 1: Login to get token
Write-Host "`n1. Logging in as admin..." -ForegroundColor Yellow
$loginBody = @{
    email = "admin@skaev.com"
    password = "Admin123!"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri 'http://localhost:5000/api/auth/login' -Method Post -Body $loginBody -ContentType 'application/json'
    Write-Host "   ✅ Login successful" -ForegroundColor Green
    Write-Host "   User: $($loginResponse.user.email)" -ForegroundColor Gray
    Write-Host "   Role: $($loginResponse.user.role)" -ForegroundColor Gray
    $token = $loginResponse.token
    Write-Host "   Token: $($token.Substring(0, 20))..." -ForegroundColor Gray
} catch {
    Write-Host "   ❌ Login failed: $_" -ForegroundColor Red
    exit 1
}

# Step 2: Get current station status
Write-Host "`n2. Getting station 1 info..." -ForegroundColor Yellow
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

try {
    $station = Invoke-RestMethod -Uri 'http://localhost:5000/api/stations/1' -Method Get -Headers $headers
    Write-Host "   ✅ Station found" -ForegroundColor Green
    Write-Host "   Name: $($station.stationName)" -ForegroundColor Gray
    Write-Host "   Current Status: $($station.status)" -ForegroundColor Gray
} catch {
    Write-Host "   ❌ Failed to get station: $_" -ForegroundColor Red
    exit 1
}

# Step 3: Toggle status
$newStatus = if ($station.status -eq "active") { "offline" } else { "active" }
Write-Host "`n3. Toggling status to: $newStatus" -ForegroundColor Yellow

$statusBody = @{
    status = $newStatus
} | ConvertTo-Json

Write-Host "   Request: PATCH /api/stations/1/status" -ForegroundColor Gray
Write-Host "   Body: $statusBody" -ForegroundColor Gray

try {
    $updateResponse = Invoke-RestMethod -Uri 'http://localhost:5000/api/stations/1/status' -Method Patch -Headers $headers -Body $statusBody
    Write-Host "   ✅ Status updated successfully" -ForegroundColor Green
    Write-Host "   Response: $($updateResponse | ConvertTo-Json)" -ForegroundColor Gray
} catch {
    Write-Host "   ❌ Failed to update status" -ForegroundColor Red
    Write-Host "   Error: $_" -ForegroundColor Red
    Write-Host "   Status Code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "   Response Body: $responseBody" -ForegroundColor Red
    }
    exit 1
}

# Step 4: Verify the change
Write-Host "`n4. Verifying status change..." -ForegroundColor Yellow
try {
    $verifyStation = Invoke-RestMethod -Uri 'http://localhost:5000/api/stations/1' -Method Get -Headers $headers
    Write-Host "   ✅ Verification successful" -ForegroundColor Green
    Write-Host "   New Status: $($verifyStation.status)" -ForegroundColor Gray
    
    if ($verifyStation.status -eq $newStatus) {
        Write-Host "`n✅ TEST PASSED - Status changed from $($station.status) to $newStatus" -ForegroundColor Green
    } else {
        Write-Host "`n⚠️ TEST WARNING - Status didn't change as expected" -ForegroundColor Yellow
        Write-Host "   Expected: $newStatus" -ForegroundColor Yellow
        Write-Host "   Got: $($verifyStation.status)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ❌ Verification failed: $_" -ForegroundColor Red
}

Write-Host ""
