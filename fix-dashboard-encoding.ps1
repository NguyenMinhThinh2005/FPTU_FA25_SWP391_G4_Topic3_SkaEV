# Fix Dashboard.jsx encoding and content
$filePath = "d:\llll\ky5\SWP\prj1\FPTU_FA25_SWP391_G4_Topic3_SkaEV\src\pages\admin\Dashboard.jsx"

Write-Host "Reading file..." -ForegroundColor Yellow
$content = Get-Content $filePath -Raw -Encoding UTF8

Write-Host "Fixing encoding issues..." -ForegroundColor Yellow

# Fix Vietnamese characters
$content = $content -replace 'Quáº£n trá»‹ há»‡ thá»'ng', 'Quản trị hệ thống'
$content = $content -replace 'GiÃ¡m sÃ¡t vÃ  quáº£n lÃ½ máº¡ng lÆ°á»›i sáº¡c', 'Giám sát và quản lý mạng lưới sạc'
$content = $content -replace 'Tá»•ng sá»'', 'Tổng số'
$content = $content -replace 'tráº¡m', 'trạm'
$content = $content -replace 'hoáº¡t Ä'á»™ng', 'hoạt động'
$content = $content -replace 'ngÆ°á»i dÃ¹ng', 'người dùng'
$content = $content -replace 'tuáº§n nÃ y', 'tuần này'
$content = $content -replace 'PhiÃªn', 'Phiên'
$content = $content -replace 'hÃ´m nay', 'hôm nay'
$content = $content -replace 'Tá»•ng doanh thu', 'Tổng doanh thu'
$content = $content -replace 'thÃ¡ng trÆ°á»›c', 'tháng trước'
$content = $content -replace 'Hiá»‡u suáº¥t', 'Hiệu suất'
$content = $content -replace 'sáº¡c', 'sạc'
$content = $content -replace 'Tráº¡ng thÃ¡i', 'Trạng thái'
$content = $content -replace 'Cá»•ng', 'Cổng'
$content = $content -replace 'Sá»­ dá»¥ng', 'Sử dụng'
$content = $content -replace 'Thao tÃ¡c', 'Thao tác'
$content = $content -replace 'Hoáº¡t Ä'á»™ng', 'Hoạt động'
$content = $content -replace 'KhÃ´ng', 'Không'
$content = $content -replace 'Báº£o trÃ¬', 'Bảo trì'
$content = $content -replace 'Táº¡m ngÆ°ng', 'Tạm ngưng'
$content = $content -replace 'gáº§n Ä'Ã¢y', 'gần đây'
$content = $content -replace 'Xem táº¥t cáº£', 'Xem tất cả'
$content = $content -replace 'Chi tiáº¿t', 'Chi tiết'
$content = $content -replace 'Vá»‹ trÃ­', 'Vị trí'
$content = $content -replace 'cÃ³ sáºµn', 'có sẵn'
$content = $content -replace 'CÃ´ng suáº¥t', 'Công suất'
$content = $content -replace 'tá»'i Ä'a', 'tối đa'
$content = $content -replace 'má»—i', 'mỗi'
$content = $content -replace 'ThÃ¡ng', 'Tháng'
$content = $content -replace 'Chá»‰nh sá»­a', 'Chỉnh sửa'
$content = $content -replace 'táº¡i Ä'Ã¢y', 'tại đây'
$content = $content -replace 'TÃªn', 'Tên'
$content = $content -replace 'Äá»‹a chá»‰', 'Địa chỉ'
$content = $content -replace 'Tá»•ng', 'Tổng'
$content = $content -replace 'nhanh', 'nhanh'
$content = $content -replace 'tiÃªu chuáº©n', 'tiêu chuẩn'
$content = $content -replace 'GiÃ¡', 'Giá'
$content = $content -replace 'ÄÃ³ng', 'Đóng'
$content = $content -replace 'LÆ°u', 'Lưu'
$content = $content -replace 'LÃªn lá»‹ch', 'Lên lịch'
$content = $content -replace 'XÃ³a', 'Xóa'
$content = $content -replace 'ThÃªm', 'Thêm'
$content = $content -replace 'Há»§y', 'Hủy'
$content = $content -replace 'Táº¡o', 'Tạo'
$content = $content -replace 'lÃ \s*báº¯t buá»™c', 'là bắt buộc'
$content = $content -replace 'KhÃ´ng thá»ƒ', 'Không thể'
$content = $content -replace 'Vui lÃ²ng', 'Vui lòng'
$content = $content -replace 'thá»­ láº¡i', 'thử lại'
$content = $content -replace 'ðŸ"„', '🔄'

Write-Host "Writing file with UTF-8 BOM encoding..." -ForegroundColor Yellow
$utf8BOM = New-Object System.Text.UTF8Encoding $true
[System.IO.File]::WriteAllText($filePath, $content, $utf8BOM)

Write-Host "✓ File fixed successfully!" -ForegroundColor Green
Write-Host "Please reload the page in browser (Ctrl+Shift+R)" -ForegroundColor Cyan
