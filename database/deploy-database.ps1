# =====================================================
# Script: Deploy Database - SkaEV Project
# Purpose: Tự động deploy MSSQL database từ DEPLOY_COMPLETE.sql
# =====================================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SkaEV Database Deployment Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Đường dẫn tới file SQL
$scriptPath = Join-Path $PSScriptRoot "DEPLOY_COMPLETE.sql"

if (-not (Test-Path $scriptPath)) {
    Write-Host "❌ ERROR: Không tìm thấy file DEPLOY_COMPLETE.sql" -ForegroundColor Red
    Write-Host "   Đường dẫn tìm kiếm: $scriptPath" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Tìm thấy file SQL script" -ForegroundColor Green
Write-Host ""

# Hỏi về SQL Server instance
Write-Host "🔧 Cấu hình SQL Server Connection" -ForegroundColor Yellow
Write-Host ""
Write-Host "Các tùy chọn phổ biến:" -ForegroundColor Gray
Write-Host "  1. localhost (SQL Server default instance)" -ForegroundColor Gray
Write-Host "  2. localhost\SQLEXPRESS (SQL Server Express)" -ForegroundColor Gray
Write-Host "  3. (localdb)\MSSQLLocalDB (LocalDB)" -ForegroundColor Gray
Write-Host "  4. Tên máy\Instance (Custom)" -ForegroundColor Gray
Write-Host ""

$serverName = Read-Host "Nhập SQL Server instance [mặc định: localhost]"
if ([string]::IsNullOrWhiteSpace($serverName)) {
    $serverName = "localhost"
}

Write-Host ""
Write-Host "🔐 Phương thức xác thực:" -ForegroundColor Yellow
Write-Host "  1. Windows Authentication (Trusted Connection) - Khuyến nghị" -ForegroundColor Gray
Write-Host "  2. SQL Server Authentication (User/Password)" -ForegroundColor Gray
Write-Host ""

$authChoice = Read-Host "Chọn phương thức [1/2, mặc định: 1]"
if ([string]::IsNullOrWhiteSpace($authChoice)) {
    $authChoice = "1"
}

$sqlcmdArgs = @()

if ($authChoice -eq "1") {
    # Windows Authentication
    $sqlcmdArgs += "-E"
    Write-Host "✅ Sử dụng Windows Authentication" -ForegroundColor Green
} else {
    # SQL Authentication
    $username = Read-Host "Nhập SQL Username [mặc định: sa]"
    if ([string]::IsNullOrWhiteSpace($username)) {
        $username = "sa"
    }
    
    $password = Read-Host "Nhập SQL Password" -AsSecureString
    $passwordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [Runtime.InteropServices.Marshal]::SecureStringToBSTR($password)
    )
    
    $sqlcmdArgs += "-U", $username, "-P", $passwordPlain
    Write-Host "✅ Sử dụng SQL Server Authentication" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Bắt đầu Deploy Database" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Test connection trước
Write-Host "🔍 Kiểm tra kết nối SQL Server..." -ForegroundColor Yellow

$testQuery = "SELECT @@VERSION AS Version;"
$testArgs = @("-S", $serverName) + $sqlcmdArgs + @("-Q", $testQuery, "-h", "-1")

try {
    $versionResult = & sqlcmd @testArgs 2>&1
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Không thể kết nối tới SQL Server!" -ForegroundColor Red
        Write-Host "   Server: $serverName" -ForegroundColor Yellow
        Write-Host "   Lỗi: $versionResult" -ForegroundColor Red
        Write-Host ""
        Write-Host "💡 Kiểm tra lại:" -ForegroundColor Yellow
        Write-Host "   - SQL Server đã chạy chưa?" -ForegroundColor Gray
        Write-Host "   - Tên server đúng chưa?" -ForegroundColor Gray
        Write-Host "   - Thông tin đăng nhập đúng chưa?" -ForegroundColor Gray
        exit 1
    }
    
    Write-Host "✅ Kết nối SQL Server thành công!" -ForegroundColor Green
    Write-Host "   SQL Server Version:" -ForegroundColor Gray
    Write-Host "   $($versionResult -join '')" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "❌ Lỗi khi test connection: $_" -ForegroundColor Red
    exit 1
}

# Deploy database
Write-Host "📦 Đang deploy database từ DEPLOY_COMPLETE.sql..." -ForegroundColor Yellow
Write-Host "   (Quá trình này có thể mất 30-60 giây)" -ForegroundColor Gray
Write-Host ""

$deployArgs = @("-S", $serverName) + $sqlcmdArgs + @("-i", $scriptPath)

try {
    $output = & sqlcmd @deployArgs 2>&1
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Deploy database thất bại!" -ForegroundColor Red
        Write-Host "   Chi tiết lỗi:" -ForegroundColor Yellow
        Write-Host $output -ForegroundColor Red
        exit 1
    }
    
    Write-Host $output -ForegroundColor Gray
    Write-Host ""
    Write-Host "✅ Deploy database thành công!" -ForegroundColor Green
    
} catch {
    Write-Host "❌ Lỗi khi deploy database: $_" -ForegroundColor Red
    exit 1
}

# Verify database
Write-Host ""
Write-Host "🔍 Kiểm tra database đã tạo thành công..." -ForegroundColor Yellow

$verifyQuery = @"
USE SkaEV_DB;
SELECT 
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE') AS TotalTables,
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.ROUTINES WHERE ROUTINE_TYPE = 'PROCEDURE') AS TotalProcedures;
"@

$verifyArgs = @("-S", $serverName) + $sqlcmdArgs + @("-Q", $verifyQuery, "-h", "-1")

try {
    $verifyResult = & sqlcmd @verifyArgs 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Verification thành công!" -ForegroundColor Green
        Write-Host "   Kết quả:" -ForegroundColor Gray
        Write-Host "   $verifyResult" -ForegroundColor Gray
        Write-Host ""
        Write-Host "   📊 Mong đợi: 16 Tables, 15 Stored Procedures" -ForegroundColor Cyan
    } else {
    Write-Host "⚠️  Không thể verify database (có thể do database đang sẵn sàng)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  Lỗi khi verify: $_" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ✨ Hoàn tất Deploy Database!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 Connection String cho appsettings.json:" -ForegroundColor Yellow
Write-Host ""

if ($authChoice -eq "1") {
    Write-Host "  `"DefaultConnection`": `"Server=$serverName;Database=SkaEV_DB;Trusted_Connection=True;TrustServerCertificate=True;MultipleActiveResultSets=true`"" -ForegroundColor Cyan
} else {
    Write-Host "  `"DefaultConnection`": `"Server=$serverName;Database=SkaEV_DB;User Id=$username;Password=YOUR_PASSWORD;TrustServerCertificate=True;MultipleActiveResultSets=true`"" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "🎯 Các bước tiếp theo:" -ForegroundColor Yellow
Write-Host "  1. Cập nhật connection string trong SkaEV.API/appsettings.json" -ForegroundColor Gray
Write-Host "  2. Chạy: cd SkaEV.API && dotnet build" -ForegroundColor Gray
Write-Host "  3. Chạy: dotnet run" -ForegroundColor Gray
Write-Host "  4. Truy cập Swagger: https://localhost:5001/swagger" -ForegroundColor Gray
Write-Host ""
Write-Host "✅ Database đang sẵn sàng sử dụng!" -ForegroundColor Green
Write-Host ""

# Hỏi có muốn mở SSMS không
$openSSMS = Read-Host "Bạn có muốn mở SQL Server Management Studio (SSMS) để xem database không? [Y/N]"
if ($openSSMS -eq "Y" -or $openSSMS -eq "y") {
    Write-Host "🚀 Đang mở SSMS..." -ForegroundColor Yellow
    Start-Process "ssms.exe" -ArgumentList "-S", $serverName, "-d", "SkaEV_DB" -ErrorAction SilentlyContinue
    
    if ($?) {
        Write-Host "✅ Đã mở SSMS" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Không tìm thấy SSMS. Bạn có thể mở thủ công." -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
