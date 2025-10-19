# =============================================
# Add Vehicles and Payment Methods via API
# =============================================

$apiBase = "http://localhost:5000/api"

# Read token from file
$token = Get-Content "$env:TEMP\skaev_token.txt" -Raw
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

Write-Host "================================" -ForegroundColor Cyan
Write-Host "Adding Data via Backend API" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# =============================================
# 1. ADD VEHICLES
# =============================================
Write-Host "1. Adding Vehicles..." -ForegroundColor Yellow
Write-Host ""

# Vehicle 1: Tesla Model 3
$vehicle1 = @{
    vehicleName = "Tesla Model 3 của tôi"
    licensePlate = "30A-12345"
    vehicleModel = "Model 3 Long Range"
    vehicleMake = "Tesla"
    vehicleYear = 2023
    batteryCapacity = 75.0
    connectorType = "Type 2"
    isDefault = $true
} | ConvertTo-Json

try {
    $response1 = Invoke-RestMethod -Uri "$apiBase/vehicles" `
                                   -Method POST `
                                   -Headers $headers `
                                   -Body $vehicle1
    Write-Host "  ✓ Added Tesla Model 3 (30A-12345)" -ForegroundColor Green
    Write-Host "    Vehicle ID: $($response1.vehicleId)" -ForegroundColor Gray
}
catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 400) {
        Write-Host "  ⚠ Tesla Model 3 might already exist or validation error" -ForegroundColor Yellow
    }
    else {
        Write-Host "  ✗ Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Start-Sleep -Seconds 1

# Vehicle 2: VinFast VF8
$vehicle2 = @{
    vehicleName = "VinFast VF8 Plus"
    licensePlate = "29B-67890"
    vehicleModel = "VF8 Plus"
    vehicleMake = "VinFast"
    vehicleYear = 2024
    batteryCapacity = 87.7
    connectorType = "CCS2"
    isDefault = $false
} | ConvertTo-Json

try {
    $response2 = Invoke-RestMethod -Uri "$apiBase/vehicles" `
                                   -Method POST `
                                   -Headers $headers `
                                   -Body $vehicle2
    Write-Host "  ✓ Added VinFast VF8 (29B-67890)" -ForegroundColor Green
    Write-Host "    Vehicle ID: $($response2.vehicleId)" -ForegroundColor Gray
}
catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 400) {
        Write-Host "  ⚠ VinFast VF8 might already exist or validation error" -ForegroundColor Yellow
    }
    else {
        Write-Host "  ✗ Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""

# =============================================
# 2. GET ALL VEHICLES
# =============================================
Write-Host "2. Fetching All Vehicles..." -ForegroundColor Yellow
Write-Host ""

try {
    $allVehicles = Invoke-RestMethod -Uri "$apiBase/vehicles" `
                                     -Method GET `
                                     -Headers $headers
    
    Write-Host "  Total Vehicles: $($allVehicles.count)" -ForegroundColor Green
    Write-Host ""
    
    foreach ($v in $allVehicles.data) {
        $defaultMark = if ($v.isDefault) { "⭐ DEFAULT" } else { "" }
        Write-Host "  • [$($v.vehicleId)] $($v.vehicleMake) $($v.vehicleModel) - $($v.licensePlate) $defaultMark" -ForegroundColor Cyan
        Write-Host "    Battery: $($v.batteryCapacity) kWh | Connector: $($v.connectorType)" -ForegroundColor Gray
    }
}
catch {
    Write-Host "  ✗ Error fetching vehicles: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "✓ Vehicles Added Successfully!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Note: Payment methods need to be added through" -ForegroundColor Yellow
Write-Host "the frontend UI for security reasons (card details)." -ForegroundColor Yellow
Write-Host ""
Write-Host "You can now:" -ForegroundColor Cyan
Write-Host "  1. Login at http://localhost:5173/login" -ForegroundColor White
Write-Host "  2. View your vehicles" -ForegroundColor White
Write-Host "  3. Add payment methods" -ForegroundColor White
Write-Host "  4. Create bookings" -ForegroundColor White
