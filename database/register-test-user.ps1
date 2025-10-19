# =============================================
# Register Test User via Backend API
# This will properly hash the password using backend's BCrypt
# =============================================

$apiUrl = "http://localhost:5000/api/auth/register"

$userData = @{
    email = "nguyenvanan@gmail.com"
    password = "Customer123!"
    fullName = "Nguyễn Văn An"
    phoneNumber = "0123456789"
} | ConvertTo-Json

Write-Host "================================" -ForegroundColor Cyan
Write-Host "Registering User via Backend API" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Email: nguyenvanan@gmail.com" -ForegroundColor Yellow
Write-Host "Password: Customer123!" -ForegroundColor Yellow
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri $apiUrl `
                                  -Method POST `
                                  -Body $userData `
                                  -ContentType "application/json" `
                                  -ErrorAction Stop
    
    Write-Host "✓ User registered successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Response:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 10 | Write-Host
    Write-Host ""
    Write-Host "================================" -ForegroundColor Cyan
    Write-Host "You can now login with:" -ForegroundColor Cyan
    Write-Host "Email: nguyenvanan@gmail.com" -ForegroundColor Yellow
    Write-Host "Password: Customer123!" -ForegroundColor Yellow
    Write-Host "================================" -ForegroundColor Cyan
}
catch {
    Write-Host "✗ Registration failed!" -ForegroundColor Red
    Write-Host ""
    
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "Status Code: $statusCode" -ForegroundColor Red
        
        try {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $errorResponse = $reader.ReadToEnd() | ConvertFrom-Json
            Write-Host "Error: $($errorResponse.message)" -ForegroundColor Red
            
            if ($errorResponse.message -like "*already exists*") {
                Write-Host ""
                Write-Host "✓ User already exists in database" -ForegroundColor Yellow
                Write-Host "You can login with the existing credentials" -ForegroundColor Yellow
            }
        }
        catch {
            Write-Host "Error response: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    else {
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}
