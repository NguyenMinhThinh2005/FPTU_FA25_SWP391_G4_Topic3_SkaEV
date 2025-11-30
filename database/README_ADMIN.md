# 🔐 Hướng Dẫn Tạo Admin Account

## 📋 Các File SQL Có Sẵn

### 1. `insert_admin.sql` - Đơn giản nhất
```sql
-- Chạy trực tiếp để tạo admin
-- Email: admin@skaev.com
-- Password: Admin@123456
```

### 2. `insert_admin_account.sql` - Có kiểm tra
```sql
-- Kiểm tra email đã tồn tại chưa
-- Email: admin@skaev.com  
-- Password: Admin@123
```

## 🚀 Cách Sử Dụng

### Cách 1: SQL Server Management Studio (SSMS)
1. Mở SSMS
2. Connect đến SQL Server
3. Chọn database `SkaEV_DB`
4. Mở file `insert_admin.sql` hoặc `insert_admin_account.sql`
5. Execute (F5)

### Cách 2: Command Line (sqlcmd)
```powershell
sqlcmd -S localhost -d SkaEV_DB -i database\insert_admin.sql
```

### Cách 3: PowerShell với Invoke-Sqlcmd
```powershell
Invoke-Sqlcmd -ServerInstance "localhost" -Database "SkaEV_DB" -InputFile "database\insert_admin.sql"
```

## 📝 Thông Tin Đăng Nhập Mặc Định

### File `insert_admin.sql`:
- **Email:** `admin@skaev.com`
- **Password:** `Admin@123456`
- **Role:** `admin`

### File `insert_admin_account.sql`:
- **Email:** `admin@skaev.com`
- **Password:** `Admin@123`
- **Role:** `admin`

## ⚠️ Lưu Ý

1. **Đổi password ngay sau khi đăng nhập lần đầu!**
2. Hash password được tạo bằng BCrypt (workFactor 12)
3. Nếu muốn đổi password, sử dụng API endpoint: `POST /api/admin/adminusers/{id}/reset-password`
4. Hoặc tạo hash mới bằng tool: `SkaEV.API/tools/PasswordHashTool`

## 🔧 Tạo Hash Password Mới

### Sử dụng C# Tool:
```powershell
cd SkaEV.API/tools/PasswordHashTool
dotnet run -- "YourPassword123" 12
```

### Hoặc trong C# code:
```csharp
using BCrypt.Net;
string hash = BCrypt.Net.BCrypt.HashPassword("YourPassword123", 12);
Console.WriteLine(hash);
```

## ✅ Kiểm Tra Admin Đã Tạo

```sql
USE SkaEV_DB;
GO

SELECT 
    user_id,
    email,
    full_name,
    role,
    is_active,
    created_at
FROM users
WHERE role = 'admin' AND deleted_at IS NULL;
```

## 🔄 Cập Nhật User Thành Admin

Nếu muốn cập nhật user hiện có thành admin:

```sql
USE SkaEV_DB;
GO

UPDATE users
SET 
    role = 'admin',
    is_active = 1,
    updated_at = SYSUTCDATETIME()
WHERE email = 'user@example.com' AND deleted_at IS NULL;
```

---

**Last Updated:** January 2025

