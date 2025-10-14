# Frontend-Backend Integration Test Guide

## Test Results Summary

### Automated Tests (PowerShell)
 **8/8 Tests PASSED** - 100% Success Rate

1.  Backend Health Check - Running on port 5000
2.  Frontend Running - Port 5173  
3.  CORS Configuration - Properly configured
4.  GET /api/stations - Retrieved 20 stations
5.  GET /api/stations/1 - Single station retrieval
6.  POST /api/auth/login - Auth endpoint working
7.  Swagger UI - Accessible at /swagger
8.  Performance - Average 59.2ms response time

## Access URLs

### Backend (ASP.NET Core)
- **API Base**: http://localhost:5000/api
- **Health Check**: http://localhost:5000/health  
- **Swagger UI**: http://localhost:5000/swagger

### Frontend (React + Vite)
- **Application**: http://localhost:5173
- **API Test Page**: http://localhost:5173/test-api

## How to Test

### 1. Quick Test (PowerShell Script)
```powershell
.\test-integration-simple.ps1
```

### 2. Browser Test (Interactive UI)

1. Mở browser và truy cập: **http://localhost:5173/test-api**

2. Click button "Run Tests" để chạy các API tests:
   - Health Check
   - Get All Stations
   - Get Single Station  
   - Auth Endpoint Test
   - Search Stations

3. Xem kết quả real-time trong UI với response data

### 3. Manual Test với Browser DevTools

1. Mở **http://localhost:5173**
2. Mở DevTools (F12)  Tab **Network**
3. Click vào các chức năng trong app
4. Xem các API requests:
   - Status code (200, 401, 404...)
   - Response headers (CORS)
   - Response data (JSON)
   - Request timing

## Test Scenarios

### Scenario 1: Xem danh sách trạm sạc
1. Truy cập: http://localhost:5173/customer/charging
2. Map sẽ load và hiển thị các trạm sạc
3. Check DevTools Network tab  GET /api/stations

### Scenario 2: Đăng nhập
1. Truy cập: http://localhost:5173/login
2. Nhập credentials:
   - Email: admin@skaev.com
   - Password: Admin@123
3. Click "Đăng nhập"
4. Check DevTools Network  POST /api/auth/login
5. Verify redirect to dashboard

### Scenario 3: Tìm kiếm trạm sạc
1. Vào trang FindStations
2. Nhập từ khóa tìm kiếm
3. Check Network tab  GET /api/stations/search?q=...

## Test với API.real.js

File src/services/api.real.js đã được tạo để kết nối thực với backend.

### Sử dụng trong code:
```javascript
import { authAPI, stationsAPI } from '../services/api.real';

// Login
const response = await authAPI.login({ email, password });

// Get stations
const stations = await stationsAPI.getAll();

// Get single station
const station = await stationsAPI.getById(1);
```

## Configuration

### Backend CORS (Program.cs)
```csharp
.WithOrigins(
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:3000"
)
```

### Frontend API URL (.env)
```
VITE_API_BASE_URL=http://localhost:5000/api
```

## Database Test Data

- **Charging Stations**: 20 records
- **Charging Posts**: 221 records  
- **Users**: 1 record

## Performance Metrics

- Average Response Time: **59.2ms**
- Min: 14ms
- Max: 100ms
- Rating: **Excellent** 

## Troubleshooting

### Backend not running?
```powershell
.\start-backend.ps1
```

### Frontend not running?
```powershell
npm run dev
```

### CORS errors in browser console?
- Check Program.cs có port frontend chưa
- Restart backend sau khi thay đổi

### 401 Unauthorized errors?
- Check token trong localStorage
- Login lại để lấy token mới

## Next Steps

1.  Backend running successfully
2.  Frontend running successfully  
3.  API integration working
4.  CORS configured properly
5.  Test login flow with real user
6.  Test booking creation
7.  Test station management (CRUD)

## Scripts Available

- .\start-backend.ps1 - Start ASP.NET Core backend
- .\check-backend.ps1 - Check backend health
- .\test-integration-simple.ps1 - Run integration tests
- 
pm run dev - Start React frontend

---
Generated: 2025-10-14 10:26:43
Backend Status:  Running
Frontend Status:  Running  
Integration Status:  Working (8/8 tests passed)
