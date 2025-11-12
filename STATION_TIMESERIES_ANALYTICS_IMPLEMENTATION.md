# Station Time-Series Analytics Implementation Guide

## Overview

Đã triển khai tính năng phân tích dữ liệu theo thời gian cho trang chi tiết trạm sạc, cho phép Admin xem biểu đồ năng lượng tiêu thụ và số phiên sạc theo khoảng thời gian tùy chỉnh.

## Các Thay Đổi Đã Thực Hiện

### 1. Frontend Changes

#### a. AdvancedCharts Component (`src/components/admin/AdvancedCharts.jsx`)

**Tính năng mới:**

- ✅ Date range picker (Từ ngày / Đến ngày)
- ✅ Button "Áp dụng" để lọc dữ liệu
- ✅ Dual-axis line chart:
  - Trục trái (Y): Năng lượng tiêu thụ (kWh)
  - Trục phải (Y): Số phiên sạc
  - Trục X: Ngày tháng (dd/MM format)
- ✅ Loading state khi đang tải dữ liệu
- ✅ Empty state khi không có dữ liệu
- ✅ Tab structure được tổ chức lại:
  - Tab 0: **NĂNG LƯỢNG TIÊU THỤ** (Time-series với date picker - MỚI)
  - Tab 1: SỬ DỤNG SLOT
  - Tab 2: DOANH THU
  - Tab 3: PHÂN BỐ THEO GIỜ

**Code highlights:**

```javascript
// State management
const [dateRange, setDateRange] = useState({
  startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0],
  endDate: new Date().toISOString().split("T")[0],
});
const [timeSeriesData, setTimeSeriesData] = useState([]);

// API call
const loadTimeSeriesData = async (start, end) => {
  const data = await reportsAPI.getStationDailyAnalytics(stationId, start, end);
  const chartData = data.map((day) => ({
    date: new Date(day.date).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
    }),
    energyKwh: day.totalEnergyKwh,
    sessions: day.totalBookings,
    revenue: day.totalRevenue,
    completedSessions: day.completedSessions,
  }));
  setTimeSeriesData(chartData);
};
```

#### b. API Integration (`src/services/api/reportsAPI.js`)

**Endpoint đã tồn tại và hoạt động:**

```javascript
getStationDailyAnalytics: async (stationId, startDate, endDate) => {
  const params = {};
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;

  const response = await api.get(
    `/admin/AdminReports/stations/${stationId}/daily`,
    { params }
  );
  return response.data?.data || response.data;
};
```

### 2. Backend (Đã Có Sẵn - Không Cần Thay Đổi)

#### a. Controller (`SkaEV.API/Controllers/AdminReportsController.cs`)

**Endpoint:**

```csharp
[HttpGet("stations/{stationId}/daily")]
public async Task<IActionResult> GetStationDailyAnalytics(
    int stationId,
    [FromQuery] DateTime? startDate = null,
    [FromQuery] DateTime? endDate = null)
{
    var analytics = await _reportService.GetStationDailyAnalyticsAsync(stationId, startDate, endDate);
    return Ok(new { success = true, data = analytics, count = analytics.Count });
}
```

#### b. Service (`SkaEV.API/Application/Services/ReportService.cs`)

**Business Logic:**

```csharp
public async Task<List<DailyAnalyticsDto>> GetStationDailyAnalyticsAsync(
    int stationId, DateTime? startDate = null, DateTime? endDate = null)
{
    // Default: last 30 days
    endDate ??= DateTime.UtcNow;
    startDate ??= endDate.Value.AddDays(-30);

    // Query bookings and invoices for each day
    // Calculate metrics: TotalBookings, TotalEnergyKwh, TotalRevenue, etc.
    // Return list of DailyAnalyticsDto
}
```

#### c. DTO (`SkaEV.API/Application/DTOs/Reports/ReportDtos.cs`)

**Data Structure:**

```csharp
public class DailyAnalyticsDto
{
    public int StationId { get; set; }
    public string StationName { get; set; }
    public DateTime Date { get; set; }
    public int TotalBookings { get; set; }
    public int CompletedSessions { get; set; }
    public int CancelledSessions { get; set; }
    public decimal TotalRevenue { get; set; }
    public decimal TotalEnergyKwh { get; set; }
    public int TotalUsageMinutes { get; set; }
    public decimal UtilizationRate { get; set; }
    public int UniqueCustomers { get; set; }
    public int PeakUsageHour { get; set; }
    public decimal AverageSessionDuration { get; set; }
}
```

### 3. Database Seeding

#### a. SQL Script (`database/seed-timeseries-analytics-data.sql`)

**Chức năng:**

- Tạo 60 ngày dữ liệu booking và invoice
- Mỗi trạm: 5-25 bookings mỗi ngày
- Phân bố thực tế:
  - 85% completed
  - 10% cancelled
  - 5% no_show
- Giờ cao điểm: 6h-22h
- Thời lượng: 30-180 phút
- Năng lượng: 10-80 kWh

#### b. PowerShell Runner (`seed-timeseries-data.ps1`)

**Cách sử dụng:**

```powershell
.\seed-timeseries-data.ps1
```

## Hướng Dẫn Test

### Bước 1: Seed Dữ Liệu (Nếu Chưa Có)

```powershell
# Option 1: Chạy script PowerShell
.\seed-timeseries-data.ps1

# Option 2: Chạy trực tiếp SQL
sqlcmd -S localhost -d SkaEVDB -E -i .\database\seed-timeseries-analytics-data.sql
```

### Bước 2: Khởi Động Backend

```powershell
cd SkaEV.API
dotnet run --no-launch-profile
```

**Hoặc sử dụng script:**

```powershell
.\start-backend.ps1
```

**Verify backend đang chạy:**

- URL: `http://localhost:5000`
- Test endpoint: `http://localhost:5000/api/admin/AdminReports/stations/1/daily?startDate=2024-10-01&endDate=2024-11-12`

### Bước 3: Khởi Động Frontend

```powershell
npm run dev
```

**URL:** `http://localhost:5173` (hoặc port Vite assign)

### Bước 4: Test Tính Năng

1. **Đăng nhập Admin:**

   - Email: `admin@skaev.com`
   - Password: `Admin@123`

2. **Navigate đến Station Detail:**

   - Menu: **Admin** → **Quản lý Trạm sạc**
   - Click vào một trạm (ví dụ: "AEON Mall Binh Duong Canary - EV Charging")

3. **Mở Tab Phân Tích:**

   - Click tab: **📊 Phân tích tổng quan**

4. **Test Date Picker:**

   - Mặc định: Last 30 days
   - Thay đổi "Từ ngày": Ví dụ `10/02/2025`
   - Thay đổi "Đến ngày": Ví dụ `11/12/2025`
   - Click **Áp dụng**

5. **Verify Chart:**
   - ✅ Line chart với 2 axes hiển thị
   - ✅ Trục trái: Năng lượng (kWh) - màu xanh dương
   - ✅ Trục phải: Số phiên sạc - màu xanh lá
   - ✅ Tooltip hiển thị chi tiết khi hover
   - ✅ Legend phân biệt rõ 2 metrics
   - ✅ Dữ liệu thực từ database (không hardcode)

## API Endpoint Documentation

### GET `/api/admin/AdminReports/stations/{stationId}/daily`

**Parameters:**

- `stationId` (path, required): Station ID
- `startDate` (query, optional): Start date (YYYY-MM-DD format)
- `endDate` (query, optional): End date (YYYY-MM-DD format)

**Default:** Last 30 days if dates not provided

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "stationId": 1,
      "stationName": "AEON Mall Binh Duong Canary - EV Charging",
      "date": "2024-10-14T00:00:00",
      "totalBookings": 15,
      "completedSessions": 13,
      "cancelledSessions": 1,
      "noShowSessions": 1,
      "totalRevenue": 450000.00,
      "totalEnergyKwh": 150.25,
      "totalUsageMinutes": 1800,
      "utilizationRate": 52.5,
      "uniqueCustomers": 12,
      "peakUsageHour": 14,
      "averageSessionDuration": 120.5
    },
    ...
  ],
  "count": 30
}
```

## Troubleshooting

### 1. Chart Không Hiển Thị

**Kiểm tra:**

```javascript
// Browser Console
console.log(timeSeriesData); // Should show array of data points
```

**Nguyên nhân có thể:**

- Backend chưa chạy
- Không có dữ liệu trong database
- Date range không hợp lệ

**Giải pháp:**

1. Verify backend running: `curl http://localhost:5000/api/admin/AdminReports/stations/1/daily`
2. Seed data: `.\seed-timeseries-data.ps1`
3. Check browser console for errors

### 2. API Error 404

**Nguyên nhân:**

- StationId không tồn tại

**Giải pháp:**

```sql
-- Check available stations
SELECT station_id, station_name FROM charging_stations;
```

### 3. Dữ Liệu Rỗng

**Nguyên nhân:**

- Không có bookings trong date range

**Giải pháp:**

```sql
-- Check existing bookings
SELECT MIN(created_at), MAX(created_at), COUNT(*)
FROM bookings
WHERE station_id = 1;
```

## Performance Considerations

### Database Indexing

Để tối ưu query performance cho time-series data:

```sql
-- Index on bookings table
CREATE INDEX IX_Bookings_StationId_CreatedAt
ON bookings(station_id, created_at);

-- Index on invoices table
CREATE INDEX IX_Invoices_CreatedAt_PaymentStatus
ON invoices(created_at, payment_status);
```

### Caching (Future Enhancement)

Có thể implement caching ở backend:

```csharp
[ResponseCache(Duration = 300)] // 5 minutes
public async Task<IActionResult> GetStationDailyAnalytics(...)
```

## Files Modified/Created

### Modified:

1. `src/components/admin/AdvancedCharts.jsx`
   - Added date picker UI
   - Added time-series chart with dual axes
   - Integrated reportsAPI.getStationDailyAnalytics

### Created:

1. `database/seed-timeseries-analytics-data.sql`

   - SQL script to generate 60 days of demo data

2. `seed-timeseries-data.ps1`

   - PowerShell runner for seeding script

3. `STATION_TIMESERIES_ANALYTICS_IMPLEMENTATION.md`
   - This documentation file

## Summary

✅ **Completed:**

- Frontend date picker with Vietnamese labels
- Dual-axis time-series chart (Energy kWh + Sessions)
- API integration using existing backend endpoint
- Database seeding script for demo data
- Comprehensive documentation

✅ **Data Flow:**

1. User selects date range → Click "Áp dụng"
2. Frontend calls `reportsAPI.getStationDailyAnalytics(stationId, startDate, endDate)`
3. Backend queries `bookings` and `invoices` tables
4. Returns `DailyAnalyticsDto[]` with aggregated metrics
5. Frontend transforms to chart format
6. Recharts renders dual-axis LineChart

✅ **100% Real Data:**

- Tất cả dữ liệu từ database (bookings, invoices)
- Không có hardcoded values
- Metrics được tính toán real-time từ backend

## Next Steps (Optional Enhancements)

1. **Export to Excel:** Add button to download chart data as CSV/Excel
2. **More Metrics:** Add revenue line to the chart (3rd axis)
3. **Comparison Mode:** Compare multiple stations side-by-side
4. **Alerts:** Show notifications when energy usage exceeds threshold
5. **Forecasting:** ML-based prediction for next 7 days

---

**Implementation Date:** November 12, 2025  
**Status:** ✅ COMPLETE AND TESTED
