# ✅ Admin Module Data Verification Checklist

## 📋 Hướng dẫn sử dụng

**Checklist này giúp bạn verify từng bước rằng Admin module đang sử dụng 100% real data từ database.**

Đánh dấu ✅ vào mỗi bước khi bạn đã kiểm tra xong.

---

## 🗄️ Step 1: Database Verification

### 1.1 Check Database Connection

```bash
# Open SQL Server Management Studio hoặc Azure Data Studio
# Connect to: (localdb)\MSSQLLocalDB
# Database: SkaEV_DB
```

- [ ] Database SkaEV_DB tồn tại
- [ ] Connection string trong appsettings.json đúng
- [ ] Database có dữ liệu (không rỗng)

### 1.2 Verify Core Tables

```sql
USE SkaEV_DB;

-- Check core tables
SELECT COUNT(*) AS UserCount FROM users;
SELECT COUNT(*) AS StationCount FROM charging_stations;
SELECT COUNT(*) AS BookingCount FROM bookings;
SELECT COUNT(*) AS InvoiceCount FROM invoices;
SELECT COUNT(*) AS SessionCount FROM charging_sessions;
```

- [ ] Table `users` có data (ít nhất 1 admin user)
- [ ] Table `charging_stations` có data
- [ ] Table `bookings` có data (hoặc ready to receive data)
- [ ] Table `invoices` có data
- [ ] Table `charging_sessions` có data

### 1.3 Verify Admin Views

```sql
-- Check views for reports
SELECT * FROM v_revenue_by_station;
SELECT * FROM v_usage_statistics;
SELECT * FROM v_station_performance;
SELECT * FROM v_admin_dashboard;
```

- [ ] View `v_revenue_by_station` tồn tại và có data
- [ ] View `v_usage_statistics` tồn tại và có data
- [ ] View `v_station_performance` tồn tại và có data
- [ ] View `v_admin_dashboard` tồn tại và có data

### 1.4 Check Admin User

```sql
-- Verify admin account exists
SELECT user_id, full_name, email, role, is_active
FROM users
WHERE role = 'admin';
```

- [ ] Có ít nhất 1 user với role = 'admin'
- [ ] Admin user có `is_active = 1`
- [ ] Password đã hash (bcrypt)
- [ ] Email: admin@skaev.com tồn tại

**Expected Result:**

```
user_id | full_name      | email              | role  | is_active
1       | System Admin   | admin@skaev.com    | admin | 1
```

---

## 🔧 Step 2: Backend API Verification

### 2.1 Start Backend Server

```bash
cd SkaEV.API
dotnet run
```

- [ ] Backend starts without errors
- [ ] Listening on http://localhost:5000
- [ ] Database connection successful
- [ ] Serilog logging working

### 2.2 Verify Controllers Exist

```bash
# Check controllers directory
ls SkaEV.API/Controllers/Admin*.cs
```

- [ ] AdminReportsController.cs exists
- [ ] AdminUsersController.cs exists
- [ ] AdminStationsController.cs exists

### 2.3 Test Admin Authentication

```powershell
# Test admin login
$body = @{
    email = "admin@skaev.com"
    password = "Admin@123"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" `
    -Method POST `
    -Body $body `
    -ContentType "application/json"
```

- [ ] Login successful
- [ ] Nhận được JWT token
- [ ] Token có role = "admin"
- [ ] Token có expiration time

**Expected Response:**

```json
{
  "success": true,
  "data": {
    "user": {
      "userId": 1,
      "email": "admin@skaev.com",
      "fullName": "System Admin",
      "role": "admin"
    },
    "token": "eyJhbGc..."
  }
}
```

### 2.4 Test AdminReports Endpoints

```powershell
# Set token from previous login
$token = "YOUR_JWT_TOKEN"

# Test revenue reports
Invoke-RestMethod -Uri "http://localhost:5000/api/admin/AdminReports/revenue?startDate=2025-01-01&endDate=2025-12-31" `
    -Method GET `
    -Headers @{ Authorization = "Bearer $token" }

# Test usage reports
Invoke-RestMethod -Uri "http://localhost:5000/api/admin/AdminReports/usage?startDate=2025-01-01&endDate=2025-12-31" `
    -Method GET `
    -Headers @{ Authorization = "Bearer $token" }

# Test dashboard summary
Invoke-RestMethod -Uri "http://localhost:5000/api/admin/AdminReports/dashboard" `
    -Method GET `
    -Headers @{ Authorization = "Bearer $token" }
```

- [ ] Revenue reports endpoint returns data
- [ ] Usage reports endpoint returns data
- [ ] Dashboard summary endpoint returns data
- [ ] All responses have `success: true`
- [ ] Data structure matches DTO format

### 2.5 Test AdminUsers Endpoints

```powershell
# Get all users
Invoke-RestMethod -Uri "http://localhost:5000/api/admin/users" `
    -Method GET `
    -Headers @{ Authorization = "Bearer $token" }

# Get user statistics
Invoke-RestMethod -Uri "http://localhost:5000/api/admin/users/statistics" `
    -Method GET `
    -Headers @{ Authorization = "Bearer $token" }
```

- [ ] Get all users returns array
- [ ] User statistics returns counts
- [ ] Data matches database counts

### 2.6 Test AdminStations Endpoints

```powershell
# Get all stations
Invoke-RestMethod -Uri "http://localhost:5000/api/admin/stations" `
    -Method GET `
    -Headers @{ Authorization = "Bearer $token" }

# Get station analytics
Invoke-RestMethod -Uri "http://localhost:5000/api/admin/stations/analytics" `
    -Method GET `
    -Headers @{ Authorization = "Bearer $token" }
```

- [ ] Get all stations returns array
- [ ] Station analytics returns metrics
- [ ] Data matches database

---

## 🌐 Step 3: Frontend API Services Verification

### 3.1 Check API Service Files

```bash
# Check frontend API services
ls src/services/api/reportsAPI.js
ls src/services/api/adminAPI.js
```

- [ ] reportsAPI.js exists
- [ ] adminAPI.js exists
- [ ] Both import axiosInstance correctly

### 3.2 Verify reportsAPI.js

Open `src/services/api/reportsAPI.js` and verify:

- [ ] `getRevenueReports(params)` calls `/admin/AdminReports/revenue`
- [ ] `getUsageReports(params)` calls `/admin/AdminReports/usage`
- [ ] `getStationPerformance(stationId)` calls `/admin/AdminReports/station-performance`
- [ ] `getPeakHours(params)` calls `/admin/AdminReports/peak-hours`
- [ ] `getDashboardSummary()` calls `/admin/AdminReports/dashboard`
- [ ] `getSystemHealth()` calls `/admin/AdminReports/system-health`
- [ ] `getUserGrowth(params)` calls `/admin/AdminReports/user-growth`
- [ ] `exportRevenueReport(params)` handles blob download

### 3.3 Verify adminAPI.js

Open `src/services/api/adminAPI.js` and verify:

- [ ] `getUserAnalytics()` calls `/admin/users/analytics`
- [ ] `getStationAnalytics()` calls `/admin/stations/analytics`
- [ ] `getAllUsers()` calls `/admin/users`
- [ ] `createUser(userData)` calls POST `/admin/users`
- [ ] `updateUser(id, userData)` calls PUT `/admin/users/{id}`
- [ ] `deleteUser(id)` calls DELETE `/admin/users/{id}`
- [ ] All methods use axiosInstance (JWT interceptor)

### 3.4 Check Axios Configuration

Open `src/services/api/axios.js` and verify:

- [ ] Base URL is `http://localhost:5000/api`
- [ ] Request interceptor adds JWT token from localStorage
- [ ] Response interceptor handles 401 errors
- [ ] Token refresh logic exists

---

## 🏪 Step 4: State Management (Zustand) Verification

### 4.1 Verify userStore.js

Open `src/store/userStore.js` and check:

```javascript
// Verify these functions call real API
fetchUsers: async () => {
  // Should call usersAPI.getAll()
};

addUser: async (userData) => {
  // Should call usersAPI.create(userData)
};

updateUser: async (id, userData) => {
  // Should call usersAPI.update(id, userData)
};

deleteUser: async (id) => {
  // Should call usersAPI.delete(id)
};
```

- [ ] `fetchUsers()` calls `usersAPI.getAll()` ✅ NO MOCK DATA
- [ ] `addUser()` calls `usersAPI.create()` ✅ NO MOCK DATA
- [ ] `updateUser()` calls `usersAPI.update()` ✅ NO MOCK DATA
- [ ] `deleteUser()` calls `usersAPI.delete()` ✅ NO MOCK DATA
- [ ] All functions update state after API call
- [ ] Error handling implemented

### 4.2 Verify stationStore.js

Open `src/store/stationStore.js` and check:

- [ ] `fetchStations()` calls stationsAPI ✅ NO MOCK DATA
- [ ] `createStation()` calls stationsAPI ✅ NO MOCK DATA
- [ ] `updateStation()` calls stationsAPI ✅ NO MOCK DATA
- [ ] `deleteStation()` calls stationsAPI ✅ NO MOCK DATA
- [ ] All functions update state after API call

---

## 🖥️ Step 5: Admin Pages Verification

### 5.1 Start Frontend

```bash
npm run dev
# Frontend at http://localhost:5173
```

- [ ] Frontend starts successfully
- [ ] No compilation errors
- [ ] Can access http://localhost:5173

### 5.2 Test Admin Login

1. Go to http://localhost:5173/login
2. Login với:
   - Email: admin@skaev.com
   - Password: Admin@123

- [ ] Login successful
- [ ] Redirected to /admin/dashboard
- [ ] Token saved in localStorage
- [ ] User info displayed in header

### 5.3 Verify Dashboard.jsx (Real-time Monitoring)

**Open:** http://localhost:5173/admin/dashboard

Check trong Browser DevTools → Network tab:

- [ ] Makes GET request to `/api/admin/stations`
- [ ] Receives station list from database
- [ ] Displays stations in grid
- [ ] Search works (filters in frontend)
- [ ] Status badges show correct status
- [ ] **NO time-based analytics** ✅
- [ ] Info banner links to AdvancedAnalytics ✅

**Console Check:**

```javascript
// In browser console
const store = useStationStore.getState();
console.log(store.stations); // Should be from API, not mock
```

- [ ] `stations` array from API (not hardcoded)
- [ ] Each station has: stationId, name, location, status, slots

### 5.4 Verify AdvancedAnalytics.jsx (Time-based Reports)

**Open:** http://localhost:5173/admin/analytics

Check Network tab:

- [ ] Makes GET to `/api/admin/AdminReports/revenue`
- [ ] Makes GET to `/api/admin/AdminReports/usage`
- [ ] Makes GET to `/api/admin/AdminReports/station-performance`
- [ ] Makes GET to `/api/admin/AdminReports/peak-hours`
- [ ] Time range selector working (7d, 30d, 90d, 12m)
- [ ] Charts render with real data
- [ ] Export CSV button works

**Data Verification:**

```javascript
// Check in console
const data = reportsAPI.getRevenueReports({
  startDate: "2025-01-01",
  endDate: "2025-12-31",
});
console.log(data); // Should have revenue data from DB
```

- [ ] Revenue data matches database v_revenue_by_station
- [ ] Usage data matches v_usage_statistics
- [ ] Performance ranking shows real stations
- [ ] Peak hours show real booking times

### 5.5 Verify UserManagement.jsx (CRUD Only)

**Open:** http://localhost:5173/admin/users

Check Network tab:

- [ ] Makes GET to `/api/admin/users` on mount
- [ ] Displays users in table
- [ ] Search works
- [ ] Filter by role works
- [ ] **NO analytics in this page** ✅

**Test CRUD Operations:**

**Create User:**

1. Click "Add User" button
2. Fill form: name, email, password, role
3. Click "Create"

- [ ] Makes POST to `/api/admin/users`
- [ ] New user appears in table
- [ ] Database updated (check SQL)

**Update User:**

1. Click "Edit" on a user
2. Change name
3. Click "Save"

- [ ] Makes PUT to `/api/admin/users/{id}`
- [ ] User info updated in table
- [ ] Database updated

**Delete User:**

1. Click "Delete" on a user
2. Confirm deletion

- [ ] Makes DELETE to `/api/admin/users/{id}`
- [ ] User removed from table
- [ ] Database updated

### 5.6 Verify StationManagement.jsx (CRUD Only)

**Open:** http://localhost:5173/admin/stations

Check Network tab:

- [ ] Makes GET to `/api/admin/stations` on mount
- [ ] Displays stations in table
- [ ] Search works
- [ ] Status filter works
- [ ] **NO analytics in this page** ✅

**Test CRUD Operations:**

**Create Station:**

1. Click "Add Station"
2. Fill form: name, location, slots
3. Click "Create"

- [ ] Makes POST to `/api/admin/stations`
- [ ] New station in table
- [ ] Database updated

**Update Station:**

1. Click "Edit" on a station
2. Change location
3. Click "Save"

- [ ] Makes PUT to `/api/admin/stations/{id}`
- [ ] Station updated
- [ ] Database updated

**Toggle Status:**

1. Click "Activate" or "Deactivate"

- [ ] Makes PATCH to `/api/admin/stations/{id}/status`
- [ ] Status changes in table
- [ ] Database updated

---

## 🔄 Step 6: Data Flow End-to-End Verification

### 6.1 Test Complete Flow: Load Users

**Flow:**

```
UserManagement.jsx → userStore.fetchUsers() → usersAPI.getAll()
→ GET /api/admin/users → AdminUsersController.GetAllUsers()
→ _context.Users.ToListAsync() → SQL Database
→ Response → Update Store → Re-render Component
```

**Verify:**

1. Open UserManagement page
2. Open DevTools → Network → Clear
3. Refresh page
4. Check network request

- [ ] Request to `/api/admin/users` sent
- [ ] Authorization header with JWT token
- [ ] Response 200 OK
- [ ] Response body has users array
- [ ] Users displayed in UI match response

**Backend Log Check:**

```bash
# Check SkaEV.API terminal logs
# Should see:
[INF] Executing endpoint 'GET /api/admin/users'
[INF] Executed DbCommand (45ms) SELECT [u].[user_id], [u].[full_name]...
[INF] Returning 25 users
```

- [ ] Log shows SQL query executed
- [ ] Query time reasonable (<100ms)
- [ ] Correct number of users returned

### 6.2 Test Complete Flow: Get Revenue Report

**Flow:**

```
AdvancedAnalytics.jsx → reportsAPI.getRevenueReports(params)
→ GET /api/admin/AdminReports/revenue → AdminReportsController
→ ReportService.GetRevenueReportsAsync() → Database Views
→ v_revenue_by_station → Response → Charts
```

**Verify:**

1. Open AdvancedAnalytics page
2. Select date range (last 30 days)
3. Check Network tab

- [ ] Request to `/admin/AdminReports/revenue?startDate=...&endDate=...`
- [ ] Response has revenue data array
- [ ] Chart displays with real data
- [ ] Tooltip shows correct values

**Database Cross-check:**

```sql
-- Run this query and compare with frontend chart
SELECT
    station_name,
    total_revenue,
    total_sessions
FROM v_revenue_by_station
WHERE date BETWEEN '2025-01-01' AND '2025-01-31';
```

- [ ] Frontend chart values match SQL query results
- [ ] Station names match
- [ ] Revenue amounts match

### 6.3 Test Complete Flow: Create User

**Flow:**

```
UserManagement Form → userStore.addUser(userData)
→ usersAPI.create(userData) → POST /api/admin/users
→ AdminUsersController.CreateUser() → _context.Users.Add()
→ Database INSERT → Response → Update Store → UI Update
```

**Verify:**

1. Click "Add User"
2. Fill form:
   - Full Name: "Test Admin"
   - Email: "test@example.com"
   - Password: "Test@123"
   - Role: "staff"
3. Submit form

- [ ] POST request to `/api/admin/users`
- [ ] Request body has user data
- [ ] Response 201 Created
- [ ] Response has new user with `userId`
- [ ] User appears in table immediately

**Database Verification:**

```sql
-- Check if user was created
SELECT * FROM users WHERE email = 'test@example.com';
```

- [ ] User exists in database
- [ ] Password is hashed (bcrypt)
- [ ] All fields saved correctly
- [ ] `created_at` timestamp set

---

## 🧪 Step 7: Automated Testing

### 7.1 Run Test Script

```powershell
# Run automated tests
.\test-admin-data-integration.ps1
```

**Expected Output:**

```
===========================================
   Admin Data Integration Tests
===========================================

Phase 1: Authentication
✅ PASS: Admin Login
   Token received, role: admin

Phase 2: User Management APIs
✅ PASS: Get All Users
   Users count: 25
✅ PASS: Get User Statistics
   Total users: 25, Active: 20
✅ PASS: Get User Analytics
   New users this month: 5

Phase 3: Station Management APIs
✅ PASS: Get All Stations
   Stations count: 10
✅ PASS: Get Station Analytics
   Active: 8, Inactive: 2

Phase 4: Reports & Analytics APIs
✅ PASS: Get Revenue Reports
   Revenue data points: 30
✅ PASS: Get Usage Reports
   Usage data points: 30
✅ PASS: Get Station Performance
   Top station: Station A
✅ PASS: Get Peak Hours
   Peak hour: 18:00
✅ PASS: Get Dashboard Summary
   Total revenue: 50000
✅ PASS: Get System Health
   Status: Healthy
✅ PASS: Get User Growth
   Growth rate: 15%

===========================================
Test Summary
===========================================
Total Tests: 13
Passed: 13
Failed: 0
Pass Rate: 100%

✅ ALL TESTS PASSED!
```

**Checklist:**

- [ ] All 13 tests pass
- [ ] No authentication errors
- [ ] All endpoints return data
- [ ] Data counts match expectations
- [ ] Pass rate: 100%

### 7.2 Manual API Testing (Optional)

Use Postman or Thunder Client:

1. Import collection with all admin endpoints
2. Set environment variable: `{{token}}`
3. Login to get token
4. Run all requests

- [ ] All requests return 200 OK
- [ ] No 401 Unauthorized errors
- [ ] Data structure matches DTOs
- [ ] Pagination works
- [ ] Filters work

---

## ✅ Step 8: Final Verification

### 8.1 Architecture Compliance

- [ ] **Dashboard** - Real-time monitoring ONLY (no time-based analytics) ✅
- [ ] **AdvancedAnalytics** - Time-based reports ONLY (no CRUD) ✅
- [ ] **UserManagement** - CRUD ONLY (no analytics) ✅
- [ ] **StationManagement** - CRUD ONLY (no analytics) ✅
- [ ] Separation of Concerns maintained ✅
- [ ] Info banner in Dashboard links to AdvancedAnalytics ✅

### 8.2 No Mock Data Verification

**Search for mock data patterns:**

```bash
# Search frontend for mock data
grep -r "const mockData" src/pages/admin/
grep -r "MOCK_" src/pages/admin/
grep -r "fake" src/pages/admin/
grep -r "dummy" src/pages/admin/
```

- [ ] No `mockData` variables found ✅
- [ ] No `MOCK_` constants found ✅
- [ ] No hardcoded arrays of data ✅
- [ ] All data from API calls ✅

### 8.3 API Integration Complete

- [ ] All stores use API services (not mock data)
- [ ] All pages call store methods on mount
- [ ] All CRUD operations go through API
- [ ] All reports fetch from backend
- [ ] Authentication required for all admin endpoints
- [ ] JWT tokens properly handled

### 8.4 Database Connection Active

- [ ] Backend successfully connects to SkaEV_DB
- [ ] All queries execute without errors
- [ ] Entity Framework context working
- [ ] Migrations applied
- [ ] Views created and functioning

### 8.5 Error Handling

- [ ] API errors display user-friendly messages
- [ ] 401 errors redirect to login
- [ ] Network errors show "Connection failed"
- [ ] Validation errors show field-level messages
- [ ] Loading states work correctly

---

## 📊 Completion Checklist

### Must Have (Critical):

- [ ] Database SkaEV_DB exists and has data
- [ ] Backend API running on port 5000
- [ ] Frontend running on port 5173
- [ ] Admin login works (admin@skaev.com)
- [ ] All 13 automated tests pass
- [ ] No mock data in code
- [ ] All pages load data from API

### Should Have (Important):

- [ ] Dashboard shows real-time station status
- [ ] AdvancedAnalytics shows time-based charts
- [ ] UserManagement CRUD operations work
- [ ] StationManagement CRUD operations work
- [ ] Reports export to CSV
- [ ] Authentication secure (JWT tokens)

### Nice to Have (Enhancement):

- [ ] Sample data generation for empty DB
- [ ] Warning message when using sample data
- [ ] Performance optimization
- [ ] Caching enabled
- [ ] Error logging to file

---

## 🎯 Final Confirmation

If you've checked all critical items above, you can confidently state:

> ✅ **Admin module sử dụng 100% dữ liệu thực từ database SQL Server thông qua API ASP.NET Core.**

> ✅ **Không có mock data, tất cả là real data từ SkaEV_DB.**

> ✅ **Frontend, Backend, API, Database đồng bộ hoàn toàn.**

> ✅ **Architecture tuân thủ Separation of Concerns.**

---

**Date Completed:** ******\_******

**Verified By:** ******\_******

**Notes:** **********************\_**********************

---

## 📚 Related Documents

- **ADMIN_DATA_VERIFICATION_REPORT.md** - Chi tiết kỹ thuật đầy đủ
- **ADMIN_DATA_SUMMARY.md** - Tổng quan nhanh cho managers
- **ADMIN_ARCHITECTURE_FINAL.md** - Kiến trúc 4 modules
- **test-admin-data-integration.ps1** - Script test tự động

---

**Status:** Ready for Verification ✅  
**Last Updated:** 03/11/2025
