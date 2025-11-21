# Quick Frontend Test Instructions

Write-Host "`n============================================================" -ForegroundColor Cyan
Write-Host "   FRONTEND BOOKING FLOW TEST" -ForegroundColor Cyan
Write-Host "============================================================`n" -ForegroundColor Cyan

# Check backend status
Write-Host "Backend Status:" -ForegroundColor Yellow
$backendProcess = Get-Process -Name "dotnet" -ErrorAction SilentlyContinue | Select-Object -First 1
if ($backendProcess) {
    Write-Host "  [OK] Backend is running (PID: $($backendProcess.Id))" -ForegroundColor Green
    Write-Host "  URL: http://localhost:5000" -ForegroundColor Gray
} else {
    Write-Host "  [FAIL] Backend is NOT running" -ForegroundColor Red
    Write-Host "  Run: .\start-backend.ps1" -ForegroundColor Yellow
}

# Check frontend status
Write-Host "`nFrontend Status:" -ForegroundColor Yellow
$nodeProcess = Get-Process -Name "node" -ErrorAction SilentlyContinue | Select-Object -First 1
if ($nodeProcess) {
    Write-Host "  [OK] Frontend is running" -ForegroundColor Green
} else {
    Write-Host "  [WARNING] Frontend might not be running" -ForegroundColor Yellow
    Write-Host "  Run: npm run dev" -ForegroundColor Yellow
}

Write-Host "`n============================================================" -ForegroundColor Cyan
Write-Host "TEST STEPS - Follow these in browser:" -ForegroundColor White
Write-Host "============================================================`n" -ForegroundColor Cyan

Write-Host "[Step 1] Open browser:" -ForegroundColor Yellow
Write-Host "   http://localhost:5173`n" -ForegroundColor White

Write-Host "[Step 2] Login with account:" -ForegroundColor Yellow
Write-Host "   Email: thinh100816@gmail.com" -ForegroundColor White
Write-Host "   Password: (your password)`n" -ForegroundColor White

Write-Host "[Step 3] Check Console Logs (F12):" -ForegroundColor Yellow
Write-Host "   Should see:" -ForegroundColor Gray
Write-Host "   >> useMasterDataSync: Loading bookings from database..." -ForegroundColor Cyan
Write-Host "   >> useMasterDataSync: Bookings loaded successfully" -ForegroundColor Green
Write-Host "   >> Master Data Sync - Current stats`n" -ForegroundColor Cyan

Write-Host "[Step 4] Navigate to Dashboard:" -ForegroundColor Yellow
Write-Host "   Check if stats show data from database" -ForegroundColor Gray
Write-Host "   - Total bookings" -ForegroundColor White
Write-Host "   - Completed bookings" -ForegroundColor White
Write-Host "   - Total amount" -ForegroundColor White
Write-Host "   - Total energy`n" -ForegroundColor White

Write-Host "[Step 5] Create New Booking:" -ForegroundColor Yellow
Write-Host "   a. Go to Stations page" -ForegroundColor Gray
Write-Host "   b. Select a station" -ForegroundColor Gray
Write-Host "   c. Fill booking form" -ForegroundColor Gray
Write-Host "   d. Click 'Dat tram'" -ForegroundColor Gray
Write-Host "   e. Check console for API response`n" -ForegroundColor Gray

Write-Host "[Step 6] Complete Charging Flow:" -ForegroundColor Yellow
Write-Host "   a. Go to My Bookings" -ForegroundColor Gray
Write-Host "   b. Find pending booking" -ForegroundColor Gray
Write-Host "   c. Click 'Bat dau sac'" -ForegroundColor Gray
Write-Host "   d. Wait for SOC tracking" -ForegroundColor Gray
Write-Host "   e. Click 'Dung sac'" -ForegroundColor Gray
Write-Host "   f. Check console:" -ForegroundColor Gray
Write-Host "      >> Completing booking via API" -ForegroundColor Cyan
Write-Host "      >> Booking completed via API`n" -ForegroundColor Green

Write-Host "[Step 7] Verify Database Sync:" -ForegroundColor Yellow
Write-Host "   a. Refresh page (F5)" -ForegroundColor Gray
Write-Host "   b. Check console logs again" -ForegroundColor Gray
Write-Host "   c. Dashboard stats should include new booking" -ForegroundColor Gray
Write-Host "   d. Payment history should show invoice`n" -ForegroundColor Gray

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "WHAT TO LOOK FOR:" -ForegroundColor White
Write-Host "============================================================`n" -ForegroundColor Cyan

Write-Host "[SUCCESS] indicators:" -ForegroundColor Green
Write-Host "  - Console shows 'Booking completed via API'" -ForegroundColor White
Write-Host "  - Console shows 'Loaded bookings from database'" -ForegroundColor White
Write-Host "  - Dashboard stats update after refresh" -ForegroundColor White
Write-Host "  - Payment history shows correct total amount" -ForegroundColor White
Write-Host "  - No localStorage-only data`n" -ForegroundColor White

Write-Host "[ERROR] indicators:" -ForegroundColor Red
Write-Host "  - Console shows 'Error completing booking via API'" -ForegroundColor White
Write-Host "  - Console shows 'Error loading user bookings'" -ForegroundColor White
Write-Host "  - Stats dont match after refresh" -ForegroundColor White
Write-Host "  - Invoice not created`n" -ForegroundColor White

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "DATABASE VERIFICATION:" -ForegroundColor White
Write-Host "============================================================`n" -ForegroundColor Cyan

Write-Host "After completing test, run this SQL to verify:" -ForegroundColor Yellow
$sqlCmd = 'sqlcmd -S "DESKTOP-2QI6746\SQLEXPRESS" -d "SkaEV_DB" -Q "SELECT TOP 5 b.booking_id, b.status, i.total_amount FROM bookings b LEFT JOIN invoices i ON b.booking_id = i.booking_id WHERE b.user_id = 2 ORDER BY b.created_at DESC"'
Write-Host $sqlCmd -ForegroundColor Cyan

Write-Host "`nReady to test! Good luck!" -ForegroundColor Green
Write-Host ""
