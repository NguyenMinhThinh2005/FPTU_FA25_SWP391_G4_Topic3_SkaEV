# Test Admin Users API with authentication

Write-Host "`n=== Testing Admin Users API ===" -ForegroundColor Cyan

# Step 1: Login to get token
Write-Host "`n1. Logging in..." -ForegroundColor Yellow
$loginBody = @{
    email = "admin@skaev.com"
    password = "Admin123!"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri 'http://localhost:5000/api/auth/login' -Method Post -Body $loginBody -ContentType 'application/json'
    Write-Host "   ✅ Login successful" -ForegroundColor Green
    Write-Host "   User: $($loginResponse.email)" -ForegroundColor White
    Write-Host "   Role: $($loginResponse.role)" -ForegroundColor White
    $token = $loginResponse.token
    Write-Host "   Token: $($token.Substring(0,30))..." -ForegroundColor White
} catch {
    Write-Host "   ❌ Login failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 2: Get users with token
Write-Host "`n2. Fetching users with token..." -ForegroundColor Yellow
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

try {
    $usersResponse = Invoke-RestMethod -Uri 'http://localhost:5000/api/admin/adminusers' -Method Get -Headers $headers
    Write-Host "   ✅ Users fetched successfully" -ForegroundColor Green
    
    if ($usersResponse.data) {
        $users = $usersResponse.data
        Write-Host "   Total users: $($users.Count)" -ForegroundColor White
        Write-Host "`n   First 3 users:" -ForegroundColor Cyan
        $users | Select-Object -First 3 | ForEach-Object {
            Write-Host "   - $($_.fullName) ($($_.email)) - Role: $($_.role)" -ForegroundColor White
        }
    } else {
        Write-Host "   ⚠️  No data in response" -ForegroundColor Yellow
        Write-Host "   Response: $($usersResponse | ConvertTo-Json)" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "   Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    }
}

Write-Host ""
