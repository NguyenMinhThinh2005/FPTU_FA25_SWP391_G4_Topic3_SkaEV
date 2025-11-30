$API = "http://localhost:5000/api"
Write-Host "VNPAY TEST" -Fore Cyan

# Register
$reg = @{email="vn@test.com";password="Pass@123";fullName="VN Test";phone="0901111111";role="customer"} | ConvertTo-Json
try { Invoke-RestMethod "$API/auth/register" -Method Post -Body $reg -ContentType "application/json" } catch {}

# Login  
$login = @{email="vn@test.com";password="Pass@123"} | ConvertTo-Json
$auth = Invoke-RestMethod "$API/auth/login" -Method Post -Body $login -ContentType "application/json"
$h = @{Authorization="Bearer $($auth.token)";ContentType="application/json"}
Write-Host "Logged in" -Fore Green

# Get/Create Vehicle
$vehs = Invoke-RestMethod "$API/vehicles/my-vehicles" -Headers $h
if (!$vehs) {
    $v = @{licensePlate="TEST123";vehicleName="Car";batteryCapacity=50;manufacturer="Tesla";model="3"} | ConvertTo-Json
    $veh = Invoke-RestMethod "$API/vehicles" -Method Post -Body $v -Headers $h
    $vehId = $veh.vehicleId
} else { $vehId = $vehs[0].vehicleId }
Write-Host "Vehicle: $vehId" -Fore Green

# Find available slot
$stns = Invoke-RestMethod "$API/stations" -Headers $h
$slot = $null
foreach ($s in $stns) {
    foreach ($sl in $s.chargingSlots) {
        if ($sl.status -eq "available") {
            $stnId = $s.stationId
            $slotId = $sl.slotId
            $slot = $sl
            break
        }
    }
    if ($slot) { break }
}
if (!$slot) { Write-Host "No slots!" -Fore Red; exit }
Write-Host "Slot: $slotId at Station $stnId" -Fore Green

# Create booking
$time1 = (Get-Date).ToUniversalTime().AddMinutes(35).ToString("yyyy-MM-ddTHH:mm:ssZ")
$time2 = (Get-Date).ToUniversalTime().AddMinutes(50).ToString("yyyy-MM-ddTHH:mm:ssZ")
$b = @{stationId=$stnId;slotId=$slotId;vehicleId=$vehId;scheduledStartTime=$time1;estimatedArrival=$time2;estimatedDuration=60;schedulingType="qr_immediate";targetSoc=80} | ConvertTo-Json
$bk = Invoke-RestMethod "$API/bookings" -Method Post -Body $b -Headers $h
Write-Host "Booking: $($bk.bookingId)" -Fore Green

# Start
Invoke-RestMethod "$API/bookings/$($bk.bookingId)/start" -Method Put -Headers $h | Out-Null
Start-Sleep 1

# Complete
$c = @{finalSoc=85;totalEnergyKwh=20;unitPrice=3500} | ConvertTo-Json
Invoke-RestMethod "$API/bookings/$($bk.bookingId)/complete" -Method Put -Body $c -Headers $h | Out-Null
Write-Host "Completed" -Fore Green

# Invoice
$inv = Invoke-RestMethod "$API/invoices/booking/$($bk.bookingId)" -Headers $h
Write-Host "Invoice: $($inv.invoiceId) - $($inv.totalAmount) VND" -Fore Cyan

# VNPay
$p = @{invoiceId=$inv.invoiceId;amount=$inv.totalAmount;orderInfo="Payment"} | ConvertTo-Json
$pay = Invoke-RestMethod "$API/vnpay/create-payment-url" -Method Post -Body $p -Headers $h
Write-Host "VNPAY URL CREATED!" -Fore Green
Write-Host $pay.paymentUrl -Fore Yellow
