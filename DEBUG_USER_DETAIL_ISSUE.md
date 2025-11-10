# DEBUG USER DETAIL ISSUE

## Vấn đề

Khi click "Xem chi tiết" trong Quản lý người dùng, hiện lỗi "Không tìm thấy người dùng"

## Đã Fix

1. ✅ Đổi API endpoint từ pagination sang direct user endpoint
2. ✅ Thêm detailed console logging
3. ✅ Handle cả 2 response formats

## Cách Debug

### Bước 1: Kiểm tra Backend

```powershell
# Check if backend is running
Get-Process | Where-Object {$_.ProcessName -like "*SkaEV*"}

# Check logs
Get-Content logs\skaev-*.txt -Tail 20
```

### Bước 2: Kiểm tra Database

Mở SQL Server và chạy:

```sql
-- Check if users exist
SELECT UserId, Email, FullName, Role, IsActive
FROM Users
WHERE IsActive = 1
ORDER BY UserId;

-- Check specific user
SELECT * FROM Users WHERE UserId = 1;
```

### Bước 3: Test API trực tiếp

```powershell
# Get list of users first
Invoke-RestMethod -Uri "http://localhost:5000/api/admin/AdminUsers?pageNumber=1&pageSize=5" -Method Get

# Test get user by ID (replace 1 with actual userId)
Invoke-RestMethod -Uri "http://localhost:5000/api/admin/AdminUsers/1" -Method Get
```

### Bước 4: Kiểm tra Frontend Console

1. Mở browser (Chrome/Edge)
2. Press F12 để mở DevTools
3. Vào tab **Console**
4. Navigate to Quản lý người dùng
5. Click "Xem chi tiết" trên 1 user
6. Xem console logs:

**Expected logs**:

```
=== FETCHING USER DETAIL ===
User ID: 1
API URL: http://localhost:5000/api/admin/AdminUsers/1
Response status: 200
Response data: {userId: 1, email: "...", ...}
✓ Setting user data: {...}
```

**If error**:

```
=== ERROR FETCHING USER ===
Error response status: 404 hoặc 500
Error response data: {...}
```

### Bước 5: Kiểm tra Network Tab

1. Trong DevTools, vào tab **Network**
2. Click "Xem chi tiết" trên user
3. Tìm request: `GET /api/admin/AdminUsers/:id`
4. Check:
   - **Status**: Phải là `200 OK`
   - **Response**: Phải có `userId`, `email`, `fullName`
   - **Headers**: Check Authorization header

### Bước 6: Common Issues

#### Issue 1: 404 Not Found

**Nguyên nhân**: User không tồn tại trong database
**Fix**:

```sql
-- Check user exists
SELECT * FROM Users WHERE UserId = YOUR_USER_ID;
```

#### Issue 2: 401 Unauthorized

**Nguyên nhân**: Không có quyền truy cập
**Fix**:

- Login lại
- Check token expiry
- Verify admin role

#### Issue 3: 500 Internal Server Error

**Nguyên nhân**: Lỗi backend
**Fix**:

- Check backend logs: `logs\skaev-*.txt`
- Check database connection
- Restart backend

#### Issue 4: CORS Error

**Nguyên nhân**: Frontend và backend khác origin
**Fix**:

```csharp
// In Program.cs, ensure CORS is configured:
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll",
        policy => policy
            .AllowAnyOrigin()
            .AllowAnyMethod()
            .AllowAnyHeader());
});
```

#### Issue 5: Wrong API URL

**Nguyên nhân**: `API_BASE_URL` không đúng
**Fix**: Check trong `UserDetail.jsx`:

```javascript
const API_BASE_URL = "http://localhost:5000/api";
```

## Quick Test Steps

### Test 1: Backend chạy chưa?

```powershell
Test-NetConnection -ComputerName localhost -Port 5000
```

Expected: `TcpTestSucceeded: True`

### Test 2: Frontend chạy chưa?

```powershell
Test-NetConnection -ComputerName localhost -Port 5173
```

Expected: `TcpTestSucceeded: True`

### Test 3: Database connect được chưa?

```powershell
# Check connection string in appsettings.json
Get-Content SkaEV.API\appsettings.json | Select-String "ConnectionStrings"
```

### Test 4: API endpoint hoạt động chưa?

```powershell
# Simple test
curl http://localhost:5000/api/admin/AdminUsers/1
```

## Expected Behavior

### ✅ Success Flow:

1. User clicks "Xem chi tiết"
2. Frontend calls: `GET /api/admin/AdminUsers/:id`
3. Backend queries database
4. Returns user data: `{userId, email, fullName, role, ...}`
5. Frontend displays user detail page with 4 tabs

### ❌ Error Flow (Current):

1. User clicks "Xem chi tiết"
2. Frontend calls API
3. **Error occurs** (404/500/etc)
4. Frontend shows "Không tìm thấy người dùng"

## Files to Check

### Frontend:

- `src/pages/admin/UserDetail.jsx` - Detailed logging added
- `src/pages/admin/UserManagement.jsx` - Navigate to detail
- Console logs will show exact error

### Backend:

- `SkaEV.API/Controllers/AdminUsersController.cs` - GetUser endpoint
- `SkaEV.API/Application/Services/AdminUserService.cs` - GetUserDetailAsync
- `logs/skaev-*.txt` - Error logs

### Database:

- Table: `Users`
- Required columns: `UserId`, `Email`, `FullName`, `Role`, `IsActive`

## Resolution Steps

1. **Start backend**:

   ```powershell
   cd SkaEV.API
   dotnet run
   ```

2. **Start frontend**:

   ```powershell
   npm run dev
   ```

3. **Open browser console** (F12)

4. **Navigate to User Management**

5. **Click "Xem chi tiết"**

6. **Check console logs** - Will show exact issue

7. **Report findings**:
   - What's the error message?
   - What's the API response status?
   - What's in the console logs?

## Contact Points

If still not working, provide:

1. Screenshot of browser console
2. Screenshot of Network tab (API call)
3. Backend log file excerpt
4. Database query result for Users table
