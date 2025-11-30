# 🚀 Quick Start - Station Analytics Feature

## ⚡ Start in 5 Minutes

### 1. Build Backend

```powershell
cd SkaEV.API
dotnet build
```

✅ Should see: "Build succeeded"

### 2. Start Backend

```powershell
dotnet run
```

✅ Backend running on: https://localhost:7777

### 3. Start Frontend (New Terminal)

```powershell
npm run dev
```

✅ Frontend running on: http://localhost:5173

### 4. Test APIs (Optional - New Terminal)

```powershell
.\test-station-analytics-api.ps1
```

✅ Should see: All endpoints tested successfully

---

## 🎯 Using the Feature

### Step 1: Login as Admin

- Open browser: http://localhost:5173
- Login credentials:
  - Email: `admin@skaev.com`
  - Password: `Admin@123`

### Step 2: Navigate to Station Management

- Click "Quản lý trạm sạc" in sidebar
- You'll see list of charging stations

### Step 3: Open Analytics for Any Station

- Click "Chi tiết phân tích" button on any station row
- You'll be redirected to detailed analytics page

### Step 4: Explore Analytics

**Overview Tab (Default)**:

- See 4 key metrics cards at top
- View time-series charts (Revenue, Bookings, Energy)
- Change date range using filters

**Hourly Analysis Tab**:

- See usage distribution by hour of day
- Identify peak hours
- View revenue by hour

**Monthly Analysis Tab**:

- View current month summary
- See daily breakdown chart
- Check completion rate

**Yearly Analysis Tab**:

- View current year summary
- See monthly trends chart
- Compare growth rate
- View detailed table

---

## 📊 What You'll See

### Overview Metrics

```
┌───────────────┬───────────────┬───────────────┬───────────────┐
│ 📅 150        │ 💰 45,000,000 │ ⚡ 3,500 kWh  │ 📈 75.5%      │
│ Tổng đặt chỗ  │ Doanh thu     │ Năng lượng    │ Tỷ lệ SD      │
└───────────────┴───────────────┴───────────────┴───────────────┘
```

### Charts

- 📈 Area Chart: Revenue & Bookings timeline
- 📊 Bar Chart: Energy consumption by day
- 📉 Line Chart: Completion vs Cancellation
- ⏰ Hourly Bar Chart: Usage by hour
- 📋 Tables: Detailed breakdown

### Date Filters

- 7 ngày qua
- 30 ngày qua ← Default
- 3 tháng qua
- 6 tháng qua
- 1 năm qua
- Tùy chỉnh (Custom date picker)

---

## 🔧 Troubleshooting

### Backend Not Starting

```powershell
# Check if port is in use
netstat -ano | findstr :7777

# If in use, kill process
taskkill /PID <process_id> /F

# Try again
cd SkaEV.API
dotnet run
```

### Frontend Not Starting

```powershell
# Clear node modules and reinstall
rm -r node_modules
npm install
npm run dev
```

### No Data Showing

- Make sure you have stations in database
- Check if bookings exist for the station
- Try different date range
- Check browser console for errors

### Authentication Error (401)

- Login again as admin
- Check if JWT token is valid
- Verify admin role in user profile

---

## 📝 API Endpoints Reference

Base URL: `https://localhost:7777/api/admin/reports`

| Endpoint                            | Method | Auth        | Description                           |
| ----------------------------------- | ------ | ----------- | ------------------------------------- |
| `/stations/{id}/detailed-analytics` | GET    | Admin/Staff | Detailed analytics with time-series   |
| `/stations/{id}/daily`              | GET    | Admin/Staff | Daily breakdown                       |
| `/stations/{id}/monthly`            | GET    | Admin/Staff | Monthly summary with daily breakdown  |
| `/stations/{id}/yearly`             | GET    | Admin/Staff | Yearly summary with monthly breakdown |
| `/stations/{id}/time-series`        | GET    | Admin/Staff | Time-series with custom granularity   |

**Query Parameters**:

- `startDate`: ISO 8601 format (e.g., `2024-10-05T00:00:00`)
- `endDate`: ISO 8601 format (e.g., `2024-11-04T23:59:59`)
- `year`: Year number (e.g., `2024`)
- `month`: Month number 1-12 (e.g., `11`)
- `granularity`: `daily`, `monthly`, or `yearly`

---

## 💡 Tips

### Performance

- Use shorter date ranges for faster loading (7-30 days)
- Longer ranges (3+ months) automatically use monthly granularity
- Charts are lazy-loaded on tab switch

### Best Practices

- Start with 30-day view for overview
- Use hourly analysis to find peak times
- Use monthly/yearly for trends
- Export data (future feature) for reports

### Keyboard Shortcuts

- Tab navigation: ← → arrow keys
- Date picker: Type dates directly
- Refresh: F5 to reload data

---

## 🎓 Learn More

- **Full Documentation**: See `STATION_ANALYTICS_COMPLETE_GUIDE.md`
- **Implementation Summary**: See `STATION_ANALYTICS_IMPLEMENTATION_SUMMARY.md`
- **Test Script**: Run `test-station-analytics-api.ps1`

---

## ✨ Quick Demo

1. **Login** → http://localhost:5173
2. **Go to** → Quản lý trạm sạc
3. **Click** → "Chi tiết phân tích" (any station)
4. **Explore** → Different tabs and date ranges
5. **Done!** → You're now using enterprise-level analytics 🎉

---

**Need Help?**

- Check console for errors (F12)
- Verify backend is running
- Ensure database has data
- Read full documentation

**Ready to Deploy?**

- All code is production-ready ✅
- No additional setup needed ✅
- Zero configuration changes ✅

---

_Last Updated: November 4, 2025_
