# HƯỚNG DẪN TEST ANALYTICS ĐẦY ĐỦ

## 🎯 Mục Tiêu

Kiểm tra xem Advanced Analytics đã kết nối database thật và hiển thị dữ liệu nhất quán chưa.

## ⚠️ VẤN ĐỀ ĐÃ PHÁT HIỆN (Trước khi fix)

- ❌ Số liệu thay đổi liên tục khi refresh (random mock data)
- ❌ Chưa kết nối database thật
- ❌ Backend ReportService trả về empty list
- ❌ Frontend fallback về mock data

## ✅ ĐÃ FIX

1. **ReportService.GetRevenueReportsAsync()**: Đã implement full LINQ query với JOIN:

   - invoices JOIN bookings JOIN charging_stations
   - GROUP BY station, year, month
   - Tính TotalRevenue, TotalEnergyKwh, AvgTransactionValue

2. **Database Views**: Đã có sẵn và hoạt động:

   - `v_admin_usage_reports` (cho GetUsageReportsAsync)
   - `v_station_performance` (cho GetStationPerformanceAsync)

3. **Sample Data Script**: `database\create-sample-analytics-data.ps1`
   - Tạo 100 bookings random trong 90 ngày qua
   - Tạo invoices tương ứng với status = 'paid'
   - Random across 5 stations

## 📋 BƯỚC TEST

### Bước 1: Tạo Sample Data (nếu database chưa có data)

```powershell
# Chạy script tạo sample data
cd database
.\create-sample-analytics-data.ps1
```

**Expected Output:**

```
Creating sample bookings and invoices for 2025...
Created booking 1: Station 1, Energy: 25.5 kWh, Total: 126225 VND
Created booking 2: Station 3, Energy: 18.2 kWh, Total: 90090 VND
...
✅ Sample data creation completed!

Year  Month  TotalBookings  CompletedBookings
2025  1      35            35
2025  2      32            32
2025  3      33            33
```

### Bước 2: Stop Backend (nếu đang chạy)

```powershell
# Tìm process đang chạy
Get-Process | Where-Object {$_.ProcessName -like "*SkaEV*"}

# Stop process (thay 7972 bằng PID thực tế)
Stop-Process -Id 7972 -Force
```

HOẶC stop từ Visual Studio / Rider.

### Bước 3: Rebuild Backend với Code Mới

```powershell
cd SkaEV.API
dotnet clean
dotnet build
```

**Expected:**

```
Build succeeded.
    0 Warning(s)
    0 Error(s)
```

### Bước 4: Start Backend

```powershell
# Option 1: Từ PowerShell
cd SkaEV.API
dotnet run

# Option 2: Từ IDE (F5 hoặc Run button)
```

**Expected:**

```
info: Microsoft.Hosting.Lifetime[14]
      Now listening on: http://localhost:5295
Application started. Press Ctrl+C to shut down.
```

### Bước 5: Test APIs với PowerShell Script

```powershell
# Quay về root folder
cd ..

# Chạy test script
.\test-analytics-real-data.ps1
```

**Expected Output (GOOD ✅):**

```
=== TESTING ANALYTICS APIS WITH REAL DATA ===

Logging in as admin@ska.vn...
✅ Login successful!

Testing Revenue Reports API...
URL: http://localhost:5295/api/admin/AdminReports/revenue?year=2025
Response status: OK
Data count: 15 (có data thật!)
Sample data:
{
  "stationId": 1,
  "stationName": "Trạm Sạc Thủ Đức",
  "year": 2025,
  "month": 3,
  "totalRevenue": 2500000,
  "totalEnergySoldKwh": 555.5,
  "totalTransactions": 35
}

✅ Revenue API returning REAL DATA from database!
```

**Bad Output (❌ - cần debug thêm):**

```
Data count: 0
NO DATA - Backend returning empty list
```

### Bước 6: Test Frontend

1. Start frontend:

```powershell
npm run dev
```

2. Mở browser: `http://localhost:5173`

3. Login với admin account:

   - Email: `admin@ska.vn`
   - Password: `Admin@123`

4. Navigate: **Advanced Analytics**

5. **KIỂM TRA QUAN TRỌNG**:

#### ✅ DẤU HIỆU TỐT (Real Data):

- Số liệu **KHÔNG thay đổi** khi nhấn refresh nhiều lần
- Có thông báo: "Đã tải 15 báo cáo doanh thu" (số > 0)
- Charts hiển thị data nhất quán
- Không có warning "Đang sử dụng dữ liệu mẫu"

#### ❌ DẤU HIỆU XẤU (Mock Data):

- Số liệu **thay đổi liên tục** mỗi lần refresh
- Có warning: "Đang sử dụng dữ liệu mẫu để demo"
- Console có error: "Failed to fetch analytics"

### Bước 7: Test Per-Station Analytics

1. Trong Advanced Analytics, click vào một station trong bảng

2. Modal "Station Detailed Analytics" sẽ hiện

3. **KIỂM TRA**:
   - Tab "Daily": Có data theo từng ngày
   - Tab "Monthly": Có data theo từng tháng
   - Tab "Yearly": Có data theo năm
   - Số liệu nhất quán, không thay đổi khi refresh

## 🔍 DEBUGGING

### Nếu Backend Build Lỗi

```powershell
# Check compile errors
cd SkaEV.API
dotnet build 2>&1 | Select-String "error"

# Common issues:
# - Field name wrong (TotalEnergyKwh vs EnergyConsumed)
# - Missing DbSet in DbContext
# - View not created in database
```

### Nếu APIs Trả Empty Data

```sql
-- Check database có data không
USE Ska_EV;

-- Check invoices
SELECT COUNT(*) as TotalInvoices,
       COUNT(CASE WHEN payment_status = 'paid' THEN 1 END) as PaidInvoices
FROM invoices
WHERE YEAR(created_at) = 2025;

-- Check bookings
SELECT COUNT(*) as TotalBookings,
       COUNT(CASE WHEN status = 'completed' THEN 1 END) as CompletedBookings
FROM bookings
WHERE YEAR(created_at) = 2025;

-- Nếu COUNT = 0, chạy lại: .\create-sample-analytics-data.ps1
```

### Nếu Frontend Vẫn Show Mock Data

**Check browser console (F12):**

```javascript
// Look for these logs:
✅ "Fetched 15 revenue reports" → Backend working
❌ "Using mock data for demo" → Backend empty/error

// Check Network tab:
✅ Status 200, Response có data → Good
❌ Status 500 → Backend error
❌ Status 200 nhưng data = [] → No database data
```

**Fix:**

1. Verify backend APIs work (step 5)
2. Clear browser cache (Ctrl+Shift+Del)
3. Hard refresh (Ctrl+F5)

### Nếu Database Connection Failed

```
Error: "Cannot open database Ska_EV"
```

**Fix:**

1. Check SQL Server đang chạy:

```powershell
Get-Service | Where-Object {$_.Name -like "*SQL*"}
```

2. Check connection string trong `appsettings.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=LAPTOP-84OFJT3R\\SQLEXPRESS;Database=Ska_EV;..."
  }
}
```

3. Test connection:

```powershell
sqlcmd -S LAPTOP-84OFJT3R\SQLEXPRESS -d Ska_EV -Q "SELECT COUNT(*) FROM invoices"
```

## 📊 TEST CASES

### Test Case 1: Revenue Reports

**Input:** Year = 2025, No station filter
**Expected:**

- API returns list with multiple stations
- Each item has: stationId, stationName, year, month, totalRevenue, totalEnergySoldKwh
- Data consistent across multiple API calls

### Test Case 2: Usage Reports

**Input:** Year = 2025, Month = 3
**Expected:**

- API returns usage statistics per station
- Fields: totalBookings, completedSessions, cancelledSessions, avgSessionDuration

### Test Case 3: Station Performance

**Input:** No filter (all stations)
**Expected:**

- Real-time occupancy percentages
- Active sessions count
- Revenue last 24h

### Test Case 4: Per-Station Detailed Analytics

**Input:** StationId = 1, DateRange = "last30days"
**Expected:**

- Daily breakdown array (30 items)
- Monthly breakdown array (3-12 items)
- Yearly breakdown array (1+ items)
- Each item has: date/month/year, revenue, sessions, energyKwh

## ✅ ACCEPTANCE CRITERIA

Hệ thống được coi là **PASS** khi:

1. ✅ Backend APIs trả về data thật từ database (count > 0)
2. ✅ Frontend không show warning "dữ liệu mẫu"
3. ✅ Số liệu **không thay đổi** khi refresh nhiều lần
4. ✅ Số liệu nhất quán giữa các sections (Revenue, Usage, Performance)
5. ✅ Per-station analytics có daily/monthly/yearly breakdowns
6. ✅ Charts render với data thật, không có mock data

## 🚀 NEXT STEPS (Sau khi test pass)

1. **Remove Mock Data Fallbacks** trong frontend:

   - Xóa `generateMockRevenueData()` và các mock functions
   - Giữ error handling nhưng không fallback về mock

2. **Add More Real Data**: Chạy script nhiều lần với dates khác nhau

3. **Performance Testing**: Test với data lớn (1000+ bookings)

4. **Edge Cases**:
   - Station không có bookings nào
   - Date range không có data
   - Filter combinations

## 📝 NOTES

- Script `create-sample-analytics-data.ps1` tạo data random nên mỗi lần chạy sẽ khác nhau
- Data được tạo trong 90 ngày gần nhất
- Mỗi booking có invoice tương ứng với status = 'paid'
- Energy range: 5-50 kWh per booking
- Unit price: 4500 VND/kWh
- Tax: 10% VAT

## 🆘 SUPPORT

Nếu test fail, cung cấp:

1. Output của `test-analytics-real-data.ps1`
2. Backend console logs
3. Frontend console errors (F12)
4. SQL query result: `SELECT COUNT(*) FROM invoices WHERE payment_status='paid'`
