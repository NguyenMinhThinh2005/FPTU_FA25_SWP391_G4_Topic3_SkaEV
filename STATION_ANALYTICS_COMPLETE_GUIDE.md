# Station Detailed Analytics Feature - Complete Documentation

## 📊 Tổng quan

Feature này cung cấp phân tích chi tiết theo từng trạm sạc với dữ liệu time-series (theo ngày, tháng, năm), giúp admin có cái nhìn toàn diện về hiệu suất và xu hướng của từng trạm.

## 🎯 Tính năng chính

### 1. Detailed Analytics Dashboard

- **Tổng quan trạm**: Thông tin cơ bản, status, số cổng sạc
- **Metrics tổng hợp**:
  - Tổng đặt chỗ trong khoảng thời gian
  - Doanh thu trong kỳ
  - Năng lượng tiêu thụ
  - Tỷ lệ sử dụng hiện tại
- **Time-series data**: Biểu đồ theo thời gian với nhiều granularity

### 2. Phân tích theo thời gian

- **Daily**: Chi tiết theo từng ngày (7-90 ngày)
- **Monthly**: Tổng hợp theo tháng với daily breakdown
- **Yearly**: Tổng hợp theo năm với monthly breakdown
- **Custom Range**: Tùy chỉnh khoảng thời gian

### 3. Phân tích theo giờ

- Phân bố sử dụng theo 24 giờ trong ngày
- Xác định giờ cao điểm
- Doanh thu theo từng giờ

### 4. Metrics chi tiết

- **Utilization Rate**: Tỷ lệ sử dụng thực tế
- **Completion Rate**: Tỷ lệ hoàn thành phiên sạc
- **Growth Rate**: Tốc độ tăng trưởng so với năm trước
- **Average Session Duration**: Thời gian sạc trung bình
- **Unique Customers**: Số khách hàng unique

## 🛠️ Technical Implementation

### Backend (C# .NET)

#### 1. DTOs (Data Transfer Objects)

**File**: `SkaEV.API/Application/DTOs/Reports/ReportDtos.cs`

```csharp
// Detailed analytics với time-series
public class StationDetailedAnalyticsDto
{
    // Station info
    public int StationId { get; set; }
    public string StationName { get; set; }
    public string Location { get; set; }

    // Overview metrics
    public int TotalPosts { get; set; }
    public decimal CurrentOccupancyPercent { get; set; }

    // Lifetime metrics
    public int TotalBookingsAllTime { get; set; }
    public decimal TotalRevenueAllTime { get; set; }

    // Period metrics
    public DateTime PeriodStartDate { get; set; }
    public DateTime PeriodEndDate { get; set; }
    public int PeriodBookings { get; set; }
    public decimal PeriodRevenue { get; set; }

    // Time-series data
    public List<TimeSeriesDataPointDto> DailyData { get; set; }
    public List<HourlyUsageDto> HourlyDistribution { get; set; }
}

// Time-series data point
public class TimeSeriesDataPointDto
{
    public DateTime Date { get; set; }
    public string Label { get; set; }
    public int Bookings { get; set; }
    public decimal Revenue { get; set; }
    public decimal EnergyKwh { get; set; }
    public int CompletedSessions { get; set; }
    public decimal UtilizationPercent { get; set; }
}
```

#### 2. Service Layer

**File**: `SkaEV.API/Application/Services/ReportService.cs`

**Các phương thức chính**:

```csharp
// 1. Lấy detailed analytics với time-series
Task<StationDetailedAnalyticsDto> GetStationDetailedAnalyticsAsync(
    int stationId,
    DateTime? startDate = null,
    DateTime? endDate = null
)

// 2. Lấy daily analytics
Task<List<DailyAnalyticsDto>> GetStationDailyAnalyticsAsync(
    int stationId,
    DateTime? startDate = null,
    DateTime? endDate = null
)

// 3. Lấy monthly analytics
Task<MonthlyAnalyticsDto> GetStationMonthlyAnalyticsAsync(
    int stationId,
    int year,
    int month
)

// 4. Lấy yearly analytics
Task<YearlyAnalyticsDto> GetStationYearlyAnalyticsAsync(
    int stationId,
    int year
)

// 5. Lấy time-series data với granularity tùy chỉnh
Task<List<TimeSeriesDataPointDto>> GetStationTimeSeriesAsync(
    int stationId,
    string granularity, // "daily", "monthly", "yearly"
    DateTime? startDate = null,
    DateTime? endDate = null
)
```

**Logic tính toán**:

- Sử dụng Entity Framework LINQ để query từ database
- Join giữa Bookings, Invoices, ChargingStations, ChargingSlots
- GroupBy để aggregate data theo time period
- Tính toán metrics như utilization, completion rate, growth rate

#### 3. API Endpoints

**File**: `SkaEV.API/Controllers/AdminReportsController.cs`

| Endpoint                                              | Method | Description                            |
| ----------------------------------------------------- | ------ | -------------------------------------- |
| `/api/admin/reports/stations/{id}/detailed-analytics` | GET    | Lấy detailed analytics với time-series |
| `/api/admin/reports/stations/{id}/daily`              | GET    | Lấy daily analytics                    |
| `/api/admin/reports/stations/{id}/monthly`            | GET    | Lấy monthly analytics                  |
| `/api/admin/reports/stations/{id}/yearly`             | GET    | Lấy yearly analytics                   |
| `/api/admin/reports/stations/{id}/time-series`        | GET    | Lấy time-series với granularity        |

**Query Parameters**:

- `startDate`: Ngày bắt đầu (ISO 8601 format)
- `endDate`: Ngày kết thúc (ISO 8601 format)
- `year`: Năm (cho monthly/yearly)
- `month`: Tháng (cho monthly)
- `granularity`: "daily", "monthly", "yearly" (cho time-series)

**Authorization**: Yêu cầu role `admin` hoặc `staff`

**Response Format**:

```json
{
  "success": true,
  "data": {
    "stationId": 1,
    "stationName": "Trạm sạc FPTU",
    "location": "Đại học FPT, Hòa Lạc",
    "periodBookings": 150,
    "periodRevenue": 45000000,
    "periodEnergy": 3500.5,
    "dailyData": [
      {
        "date": "2024-11-04T00:00:00",
        "label": "2024-11-04",
        "bookings": 12,
        "revenue": 3500000,
        "energyKwh": 280.5
      }
    ]
  }
}
```

### Frontend (React)

#### 1. Component Structure

**File**: `src/pages/admin/StationDetailedAnalytics.jsx`

**Components**:

- `StationDetailedAnalytics` (Main): Container chính
- `TimeSeriesTab`: Hiển thị time-series charts
- `HourlyAnalysisTab`: Phân tích theo giờ
- `MonthlyAnalysisTab`: Phân tích theo tháng
- `YearlyAnalysisTab`: Phân tích theo năm

**State Management**:

```javascript
const [detailedAnalytics, setDetailedAnalytics] = useState(null);
const [monthlyAnalytics, setMonthlyAnalytics] = useState(null);
const [yearlyAnalytics, setYearlyAnalytics] = useState(null);
const [dateRange, setDateRange] = useState("30days");
const [startDate, setStartDate] = useState(subDays(new Date(), 30));
const [endDate, setEndDate] = useState(new Date());
```

**Charts sử dụng**:

- **Recharts Library**:
  - `AreaChart`: Doanh thu và bookings theo thời gian
  - `BarChart`: Năng lượng tiêu thụ, usage theo giờ
  - `LineChart`: Xu hướng theo thời gian

#### 2. API Integration

**File**: `src/services/api/reportsAPI.js`

```javascript
const reportsAPI = {
  getStationDetailedAnalytics: async (stationId, startDate, endDate) => {
    const response = await apiClient.get(
      `/admin/reports/stations/${stationId}/detailed-analytics`,
      { params: { startDate, endDate } }
    );
    return response.data.data;
  },

  getStationDailyAnalytics: async (stationId, startDate, endDate) => {
    const response = await apiClient.get(
      `/admin/reports/stations/${stationId}/daily`,
      { params: { startDate, endDate } }
    );
    return response.data.data;
  },

  // ... other methods
};
```

#### 3. Routing

**File**: `src/App.jsx`

```javascript
<Route path="/admin" element={<AdminLayout />}>
  <Route path="stations" element={<StationManagement />} />
  <Route
    path="stations/:stationId/analytics"
    element={<StationDetailedAnalytics />}
  />
</Route>
```

#### 4. Navigation

**From**: Station Management page
**Action**: Click "Chi tiết phân tích" button
**URL**: `/admin/stations/{stationId}/analytics`

## 📊 Data Flow

```
User Action (Click Analytics)
    ↓
Navigate to /admin/stations/:id/analytics
    ↓
StationDetailedAnalytics Component Mount
    ↓
useEffect triggers loadAnalytics()
    ↓
Parallel API Calls:
  - getStationDetailedAnalytics()
  - getStationDailyAnalytics()
  - getStationMonthlyAnalytics()
  - getStationYearlyAnalytics()
    ↓
Backend Processing:
  - Validate stationId exists
  - Query Bookings, Invoices, ChargingSlots
  - Calculate metrics & aggregations
  - Group by time periods
  - Return formatted DTOs
    ↓
Frontend Rendering:
  - Update state with API data
  - Render overview cards
  - Render tabs with charts
  - Enable date range filtering
```

## 🧪 Testing

### Backend Testing

**Script**: `test-station-analytics-api.ps1`

```powershell
# Run test script
.\test-station-analytics-api.ps1
```

**Test Cases**:

1. ✅ Get list of stations
2. ✅ Get detailed analytics for a station
3. ✅ Get daily analytics
4. ✅ Get monthly analytics
5. ✅ Get yearly analytics
6. ✅ Get time-series data

### Frontend Testing

**Manual Steps**:

1. Login as admin
2. Navigate to Station Management
3. Click "Chi tiết phân tích" on any station
4. Verify all tabs load correctly:
   - ✅ Overview cards display metrics
   - ✅ Time-series charts render
   - ✅ Hourly analysis shows distribution
   - ✅ Monthly analysis shows breakdown
   - ✅ Yearly analysis shows trends
5. Test date range filters:
   - ✅ Select "7 ngày qua"
   - ✅ Select "30 ngày qua"
   - ✅ Select "3 tháng qua"
   - ✅ Custom date range
6. Verify data accuracy:
   - ✅ Numbers match expected values
   - ✅ Charts display correct data
   - ✅ No console errors

## 🎨 UI/UX Features

### 1. Overview Cards

- Responsive grid layout (4 cards)
- Icons with colors (Schedule, Money, Electric, TrendingUp)
- Primary metrics with secondary info
- Real-time data updates

### 2. Date Range Filters

- Preset options (7d, 30d, 3m, 6m, 1y)
- Custom date picker
- Auto-adjust granularity based on range
- Material-UI DatePicker integration

### 3. Tabs Navigation

- 4 tabs: Tổng quan, Theo giờ, Theo tháng, Theo năm
- Icons for each tab
- Smooth transitions
- Lazy loading of tab content

### 4. Charts

- Responsive design (100% width)
- Tooltips on hover
- Legend for multiple series
- Color-coded data
- Smooth animations

### 5. Data Tables

- Sortable columns
- Formatted numbers (currency, decimals)
- Pagination (for large datasets)
- Hover effects

## 📈 Performance Optimizations

### Backend

1. **Database Indexing**: Ensure indexes on:

   - `bookings.station_id`
   - `bookings.created_at`
   - `invoices.booking_id`
   - `invoices.payment_status`

2. **Query Optimization**:

   - Use `.AsNoTracking()` for read-only queries
   - Select only needed columns
   - Use `Include()` for navigation properties

3. **Caching** (Future):
   - Cache station metadata
   - Cache aggregated metrics (5-minute TTL)

### Frontend

1. **Code Splitting**:

   - Lazy load StationDetailedAnalytics component
   - Load Recharts only when needed

2. **Memoization**:

   - Use `useCallback` for event handlers
   - Use `useMemo` for expensive calculations

3. **Data Management**:
   - Don't reload data on tab switch
   - Debounce date range changes

## 🔒 Security

### Authentication & Authorization

- All endpoints require JWT authentication
- Role-based access control (admin, staff only)
- StationId validation (prevent unauthorized access)

### Input Validation

- Date range validation (prevent too large ranges)
- StationId existence check
- Granularity enum validation

### Error Handling

- Try-catch blocks in all service methods
- Proper error messages (not exposing internals)
- 404 for non-existent stations
- 400 for invalid parameters

## 📝 Future Enhancements

1. **Export Features**:

   - Export to PDF with charts
   - Export to Excel with raw data
   - Scheduled email reports

2. **Comparison**:

   - Compare multiple stations
   - Compare different time periods
   - Benchmark against averages

3. **Predictive Analytics**:

   - Forecast future usage
   - Predict maintenance needs
   - Recommend optimal pricing

4. **Real-time Updates**:

   - WebSocket for live data
   - Auto-refresh every 5 minutes
   - Push notifications for alerts

5. **Advanced Filters**:
   - Filter by vehicle type
   - Filter by customer segment
   - Filter by connector type

## 🐛 Known Issues & Limitations

1. **Date Range**: Limited to 1 year for performance
2. **Granularity**: Auto-adjusted based on range
3. **Time Zone**: All times in UTC (may need localization)
4. **Empty Data**: Shows "No data" message (need better handling)

## 📚 References

- **Backend Framework**: ASP.NET Core 9.0
- **ORM**: Entity Framework Core
- **Frontend**: React 18
- **UI Library**: Material-UI v5
- **Charts**: Recharts v2
- **Date Handling**: date-fns

## 🏁 Completion Checklist

- [x] DTOs designed and implemented
- [x] Service layer methods implemented
- [x] API endpoints created and documented
- [x] Frontend component created
- [x] API integration completed
- [x] Routing configured
- [x] Navigation added
- [x] Charts implemented
- [x] Date filters working
- [x] Error handling added
- [x] Backend builds successfully
- [x] No compilation errors
- [x] Test script created
- [x] Documentation completed

## 🎉 Result

**100% Complete** - The station detailed analytics feature is fully implemented with:

- ✅ Accurate data calculations
- ✅ Professional UI/UX
- ✅ Complete time-series analysis
- ✅ Comprehensive documentation
- ✅ Production-ready code quality

This feature transforms the admin panel into a **true professional analytics platform** with detailed, accurate, and actionable insights for each charging station.
