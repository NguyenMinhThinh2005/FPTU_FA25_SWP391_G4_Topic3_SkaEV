# VNPay Integration Test - Simplified Version
# Tests: Create Booking -> Complete -> Get Invoice -> Create Payment URL -> Verify Callback

param(
    [string]$API_BASE = "http://localhost:5000/api",
    [string]$HASH_SECRET = "YOUR_VNPAY_HASH_SECRET",
    [string]$TMN_CODE = "YOUR_VNPAY_TMN_CODE"
)

function Write-TestResult {
    param($TestName, $Result, $Message)
    $color = if ($Result -eq "PASSED") { "Green" } else { "Red" }
    $icon = if ($Result -eq "PASSED") { "✅" } else { "❌" }
    Write-Host "$icon $TestName - $Result" -ForegroundColor $color
    if ($Message) { Write-Host "   $Message" -ForegroundColor Gray }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  VNPAY INTEGRATION TEST" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Register test user if not exists
Write-Host "→ Preparing test user..." -ForegroundColor Yellow
$registerBody = '{"email":"vnpaytest@skaev.com","password":"Test@1234","fullName":"VNPay Test User","phoneNumber":"0999888777","role":"customer"}'
try {
    Invoke-RestMethod -Uri "$API_BASE/auth/register" -Method Post -Body $registerBody -ContentType "application/json" | Out-Null
    Write-Host "  User registered successfully" -ForegroundColor Green
} catch {
    Write-Host "  User ready (already exists)" -ForegroundColor Gray
}

# Login to get token
Write-Host "→ Logging in..." -ForegroundColor Yellow
$loginBody = '{"email":"vnpaytest@skaev.com","password":"Test@1234"}'
try {
    $loginResp = Invoke-RestMethod -Uri "$API_BASE/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    $token = $loginResp.token
    Write-Host "  Logged in successfully`n" -ForegroundColor Green
} catch {
    Write-Host "  Login failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

# TEST CASE 1: Create Payment URL
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TEST 1: Create Invoice & Payment URL" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

try {
    Write-Host "→ Creating booking..." -ForegroundColor Yellow
    # Backend expects UTC time, will convert to Vietnam time (UTC+7)
    # Send time 35 minutes from now to satisfy 30-min minimum requirement
    $scheduledTime = (Get-Date).ToUniversalTime().AddMinutes(35).ToString("yyyy-MM-ddTHH:mm:ssZ")
    $arrivalTime = (Get-Date).ToUniversalTime().AddMinutes(50).ToString("yyyy-MM-ddTHH:mm:ssZ")
    
    $bookingJson = @"
{
    "stationId": 1,
    "slotId": 1,
    "vehicleId": 28,
    "scheduledStartTime": "$scheduledTime",
    "estimatedArrival": "$arrivalTime",
    "estimatedDuration": 60,
    "schedulingType": "qr_immediate",
    "targetSoc": 80
}
"@
    
    $booking = Invoke-RestMethod -Uri "$API_BASE/bookings" -Method Post -Body $bookingJson -Headers $headers
    $bookingId = $booking.bookingId
    Write-Host "  Booking created: ID=$bookingId`n" -ForegroundColor Green
    
    Start-Sleep -Seconds 2
    
    Write-Host "→ Starting charging..." -ForegroundColor Yellow
    Invoke-RestMethod -Uri "$API_BASE/bookings/$bookingId/start" -Method Put -Headers $headers | Out-Null
    Write-Host "  Charging started`n" -ForegroundColor Green
    
    Start-Sleep -Seconds 2
    
    Write-Host "→ Completing charging..." -ForegroundColor Yellow
    $completeJson = '{"finalSoc":80,"totalEnergyKwh":25.5,"unitPrice":3500}'
    Invoke-RestMethod -Uri "$API_BASE/bookings/$bookingId/complete" -Method Put -Body $completeJson -Headers $headers | Out-Null
    Write-Host "  Charging completed`n" -ForegroundColor Green
    
    Start-Sleep -Seconds 1
    
    Write-Host "→ Getting invoice..." -ForegroundColor Yellow
    $invoice = Invoke-RestMethod -Uri "$API_BASE/invoices/booking/$bookingId" -Method Get -Headers $headers
    $invoiceId = $invoice.invoiceId
    $amount = $invoice.totalAmount
    Write-Host "  Invoice: ID=$invoiceId, Amount=$amount VND`n" -ForegroundColor Green
    
    Write-Host "→ Creating VNPay payment URL..." -ForegroundColor Yellow
    $paymentJson = "{`"invoiceId`":$invoiceId,`"amount`":$amount,`"orderDescription`":`"Test payment`"}"
    $payment = Invoke-RestMethod -Uri "$API_BASE/vnpay/create-payment-url" -Method Post -Body $paymentJson -Headers $headers
    $paymentUrl = $payment.data.paymentUrl
    
    Write-Host "  Payment URL: $paymentUrl`n" -ForegroundColor Green
    
    if ($paymentUrl -match "vnpayment") {
        Write-TestResult "TEST 1" "PASSED" "Payment URL created successfully"
    } else {
        Write-TestResult "TEST 1" "FAILED" "Invalid payment URL"
        exit 1
    }
    
} catch {
    Write-TestResult "TEST 1" "FAILED" $_.Exception.Message
    Write-Host "Response: $($_.Exception.Response | Out-String)" -ForegroundColor Red
    exit 1
}

# TEST CASE 2: Verify Valid Callback
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "TEST 2: Verify Valid Callback" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

try {
    Write-Host "→ Building VNPay callback params..." -ForegroundColor Yellow
    
    $vnpAmount = [long]($amount * 100)
    $vnpTxnRef = "INV${invoiceId}_$(Get-Date -Format 'yyyyMMddHHmmss')"
    $vnpDate = Get-Date -Format "yyyyMMddHHmmss"
    
    $params = [ordered]@{
        "vnp_Amount" = $vnpAmount.ToString()
        "vnp_BankCode" = "NCB"
        "vnp_BankTranNo" = "VNP14588889"
        "vnp_CardType" = "ATM"
        "vnp_OrderInfo" = "Test payment"
        "vnp_PayDate" = $vnpDate
        "vnp_ResponseCode" = "00"
        "vnp_TmnCode" = $TMN_CODE
        "vnp_TransactionNo" = "14588889"
        "vnp_TransactionStatus" = "00"
        "vnp_TxnRef" = $vnpTxnRef
    }
    
    Write-Host "→ Calculating signature..." -ForegroundColor Yellow
    $signData = ($params.GetEnumerator() | ForEach-Object { "$($_.Key)=$($_.Value)" }) -join "&"
    $hmac = New-Object System.Security.Cryptography.HMACSHA512
    $hmac.Key = [System.Text.Encoding]::UTF8.GetBytes($HASH_SECRET)
    $hash = [System.BitConverter]::ToString($hmac.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($signData))).Replace("-", "").ToLower()
    $params["vnp_SecureHash"] = $hash
    
    $query = ($params.GetEnumerator() | ForEach-Object { "$($_.Key)=$([Uri]::EscapeDataString($_.Value))" }) -join "&"
    
    Write-Host "→ Calling verify-return..." -ForegroundColor Yellow
    $verify = Invoke-RestMethod -Uri "$API_BASE/vnpay/verify-return?$query" -Method Get
    
    if ($verify.success -eq $true) {
        Start-Sleep -Seconds 1
        $invoiceCheck = Invoke-RestMethod -Uri "$API_BASE/invoices/$invoiceId" -Method Get -Headers $headers
        
        if ($invoiceCheck.paymentStatus -eq "paid") {
            Write-TestResult "TEST 2" "PASSED" "Payment verified and invoice updated to 'paid'"
        } else {
            Write-TestResult "TEST 2" "FAILED" "Invoice status: $($invoiceCheck.paymentStatus)"
        }
    } else {
        Write-TestResult "TEST 2" "FAILED" "Verification returned false"
    }
    
} catch {
    Write-TestResult "TEST 2" "FAILED" $_.Exception.Message
}

# TEST CASE 3: Invalid Signature
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "TEST 3: Invalid Signature (Sad Path)" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

try {
    Write-Host "→ Creating callback with bad signature..." -ForegroundColor Yellow
    $badHash = $hash.Substring(0, $hash.Length - 5) + "AAAAA"
    $params["vnp_SecureHash"] = $badHash
    
    $badQuery = ($params.GetEnumerator() | ForEach-Object { "$($_.Key)=$([Uri]::EscapeDataString($_.Value))" }) -join "&"
    
    Write-Host "→ Calling verify-return with invalid signature..." -ForegroundColor Yellow
    
    try {
        $badVerify = Invoke-RestMethod -Uri "$API_BASE/vnpay/verify-return?$badQuery" -Method Get -ErrorAction Stop
        
        if ($badVerify.success -eq $false) {
            Write-TestResult "TEST 3" "PASSED" "Correctly rejected invalid signature: $($badVerify.message)"
        } else {
            Write-TestResult "TEST 3" "FAILED" "Invalid signature was accepted!"
        }
    } catch {
        if ($_.Exception.Response.StatusCode -eq 400) {
            Write-TestResult "TEST 3" "PASSED" "Correctly rejected with HTTP 400"
        } else {
            throw
        }
    }
    
} catch {
    Write-TestResult "TEST 3" "FAILED" $_.Exception.Message
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  TEST COMPLETE" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan
