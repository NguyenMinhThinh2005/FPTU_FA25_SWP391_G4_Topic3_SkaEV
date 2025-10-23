# Database Setup Guide

## Bước 1: Cài đặt SQL Server

Mỗi developer cần có SQL Server trên máy của mình. Có 2 options:

### Option A: SQL Server Express (Recommended)
- Download: https://www.microsoft.com/en-us/sql-server/sql-server-downloads
- Chọn "Express" edition (free)
- Cài đặt với tên instance: `SQLEXPRESS` hoặc `MSSQLSERVER`

### Option B: LocalDB (Lighter)
- Đã có sẵn khi cài Visual Studio
- Connection string: `(localdb)\MSSQLLocalDB`

## Bước 2: Tìm tên SQL Server Instance của bạn

Mở PowerShell và chạy:
```powershell
sqlcmd -L
```

Hoặc kiểm tra trong SQL Server Management Studio (SSMS).

Ví dụ tên instance:
- `DESKTOP-ABC123\SQLEXPRESS`
- `LAPTOP-XYZ\MSSQLSERVER01`
- `(localdb)\MSSQLLocalDB`

## Bước 3: Tạo file `appsettings.Development.json`

Trong folder `SkaEV.API/`, copy file example:

```powershell
cd SkaEV.API
copy appsettings.Development.json.example appsettings.Development.json
```

Sau đó mở file `appsettings.Development.json` và sửa connection string:

### Nếu bạn dùng LocalDB (có sẵn trong Visual Studio):
```json
"DefaultConnection": "Server=(localdb)\\mssqllocaldb;Database=SkaEV_DB;Integrated Security=true;TrustServerCertificate=True;MultipleActiveResultSets=true"
```

### Nếu bạn dùng SQL Server Express:
Thay `YOUR_SERVER_NAME\\YOUR_INSTANCE` bằng tên SQL Server instance của bạn:

```json
"DefaultConnection": "Server=YOUR_COMPUTER_NAME\\SQLEXPRESS;Database=SkaEV_DB;Trusted_Connection=True;TrustServerCertificate=True;MultipleActiveResultSets=true"
```

**Ví dụ:**
- `Server=DESKTOP-ABC123\\SQLEXPRESS;...`
- `Server=LAPTOP-XYZ\\MSSQLSERVER01;...`

**Lưu ý:** File `appsettings.Development.json` đã được gitignore nên không bị push lên Git.

## Bước 4: Deploy Database Schema

Chạy script tạo database:

```powershell
# Option 1: Dùng Windows Authentication
sqlcmd -S YOUR_SERVER_NAME\YOUR_INSTANCE -E -i database\SkaEV_DB.sql

# Option 2: Dùng SQL Authentication
sqlcmd -S YOUR_SERVER_NAME\YOUR_INSTANCE -U sa -P YOUR_PASSWORD -i database\SkaEV_DB.sql
```

## Bước 5: Insert Test Data

```powershell
sqlcmd -S YOUR_SERVER_NAME\YOUR_INSTANCE -E -d SkaEV_DB -i database\insert-test-data.sql
```

## Bước 6: Verify Connection

Chạy backend:
```powershell
cd SkaEV.API
dotnet run
```

Nếu thấy log:
```
[INF] Starting SkaEV API...
```
→ ✅ Database connection thành công!

## Troubleshooting

### Lỗi "Login failed for user"
- Kiểm tra SQL Server có cho phép Windows Authentication
- Hoặc dùng SQL Authentication với username/password

### Lỗi "A network-related or instance-specific error"
- Kiểm tra SQL Server service đang chạy
- Kiểm tra tên instance đúng chưa
- Bật TCP/IP trong SQL Server Configuration Manager

### Lỗi "Cannot open database SkaEV_DB"
- Chạy lại script `database\SkaEV_DB.sql` để tạo database

### Lỗi "Slot is not available"
- Reset slot status:
```sql
UPDATE charging_slots SET status = 'available' WHERE status = 'reserved'
```

## Environment Variables

File `appsettings.Development.json` sẽ override `appsettings.json` khi chạy ở Development mode.

**IMPORTANT**: 
- ❌ KHÔNG commit `appsettings.Development.json` lên Git
- ✅ Mỗi developer tự tạo file này với connection string riêng
