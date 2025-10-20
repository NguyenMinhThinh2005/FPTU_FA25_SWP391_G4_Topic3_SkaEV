# SQL Server Schema Deployment Guide

## 📋 Yêu cầu hệ thống

- **SQL Server**: 2019 trở lên (hoặc Azure SQL Database)
- **Quyền**: `db_owner` hoặc `db_ddladmin` + `db_datawriter`
- **Database Collation**: `SQL_Latin1_General_CP1_CI_AS` (hoặc Unicode collation)

## 🚀 Cách triển khai

### Bước 1: Tạo Database

```sql
-- Mở SQL Server Management Studio (SSMS) hoặc Azure Data Studio
-- Chạy script sau:

CREATE DATABASE SkaEV
COLLATE SQL_Latin1_General_CP1_CI_AS;
GO

USE SkaEV;
GO
```

### Bước 2: Chạy Schema Script

**Option A: Từ SSMS**
1. Mở file `03_SCHEMA_MSSQL.sql`
2. Kết nối đến SQL Server instance
3. Chọn database `SkaEV`
4. Nhấn F5 để execute

**Option B: Từ Command Line**
```powershell
sqlcmd -S localhost -d SkaEV -i "database\03_SCHEMA_MSSQL.sql"
```

**Option C: Từ Azure Data Studio**
1. Connect to server
2. Select database `SkaEV`
3. Open `03_SCHEMA_MSSQL.sql`
4. Click "Run" or press F5

### Bước 3: Verify Deployment

```sql
-- Check tables created
SELECT 
    TABLE_SCHEMA,
    TABLE_NAME,
    TABLE_TYPE
FROM INFORMATION_SCHEMA.TABLES
ORDER BY TABLE_NAME;

-- Check indexes
SELECT 
    OBJECT_NAME(i.object_id) AS TableName,
    i.name AS IndexName,
    i.type_desc
FROM sys.indexes i
WHERE i.object_id IN (
    SELECT object_id 
    FROM sys.tables 
    WHERE schema_id = SCHEMA_ID('dbo')
)
ORDER BY TableName, IndexName;

-- Check triggers
SELECT 
    OBJECT_NAME(parent_id) AS TableName,
    name AS TriggerName,
    type_desc
FROM sys.triggers
WHERE parent_class = 1
ORDER BY TableName;

-- Check functions
SELECT 
    ROUTINE_NAME,
    ROUTINE_TYPE
FROM INFORMATION_SCHEMA.ROUTINES
WHERE ROUTINE_TYPE = 'FUNCTION'
ORDER BY ROUTINE_NAME;

-- Check views
SELECT 
    TABLE_NAME AS ViewName
FROM INFORMATION_SCHEMA.VIEWS
ORDER BY ViewName;
```

## 🔧 Troubleshooting

### Lỗi: "Database already exists"
```sql
-- Drop database nếu cần reset
USE master;
GO
DROP DATABASE IF EXISTS SkaEV;
GO
```

### Lỗi: "Cannot create constraint"
- Kiểm tra data type compatibility
- Đảm bảo tables được tạo theo đúng thứ tự
- Verify foreign key references

### Lỗi: "Invalid object name"
- Chạy từng batch riêng biệt (split bởi `GO`)
- Check database context (`USE SkaEV;`)

### Lỗi: Spatial Index
Nếu không có spatial support:
```sql
-- Comment out hoặc skip spatial index
-- CREATE SPATIAL INDEX idx_stations_location ON charging_stations(location);
```

## 📊 Performance Tuning (Optional)

### 1. Enable Query Store
```sql
ALTER DATABASE SkaEV
SET QUERY_STORE = ON;
```

### 2. Update Statistics
```sql
-- After loading data
EXEC sp_updatestats;
```

### 3. Rebuild Indexes
```sql
-- After bulk data load
EXEC sp_MSforeachtable 
    'ALTER INDEX ALL ON ? REBUILD WITH (ONLINE = OFF)';
```

### 4. Create Partition for Time-series Data (Enterprise Edition)
```sql
-- Example for soc_charging_history
CREATE PARTITION FUNCTION pf_monthly_history (DATETIME2)
AS RANGE RIGHT FOR VALUES 
    ('2025-01-01', '2025-02-01', '2025-03-01', ...);

CREATE PARTITION SCHEME ps_monthly_history
AS PARTITION pf_monthly_history
ALL TO ([PRIMARY]);

-- Then recreate table with partition scheme
```

## 🔐 Security Setup

### Create Application User
```sql
-- Create login
CREATE LOGIN skaev_app_user 
WITH PASSWORD = 'YourStrongPassword123!';
GO

-- Create database user
USE SkaEV;
GO
CREATE USER skaev_app_user FOR LOGIN skaev_app_user;
GO

-- Grant permissions
ALTER ROLE db_datareader ADD MEMBER skaev_app_user;
ALTER ROLE db_datawriter ADD MEMBER skaev_app_user;
GO

-- Grant execute on functions
GRANT EXECUTE ON SCHEMA::dbo TO skaev_app_user;
GO
```

### Enable Row-Level Security (RLS) - Optional
```sql
-- Example: Customers can only see their own data
CREATE FUNCTION dbo.fn_securitypredicate_bookings(@customer_id UNIQUEIDENTIFIER)
RETURNS TABLE
WITH SCHEMABINDING
AS
RETURN SELECT 1 AS result
WHERE @customer_id = CAST(SESSION_CONTEXT(N'CustomerId') AS UNIQUEIDENTIFIER)
   OR IS_MEMBER('db_owner') = 1;
GO

CREATE SECURITY POLICY BookingsSecurityPolicy
ADD FILTER PREDICATE dbo.fn_securitypredicate_bookings(customer_id) ON dbo.bookings
WITH (STATE = ON);
GO
```

## 📝 Connection String Examples

### .NET (C#)
```csharp
Server=localhost;Database=SkaEV;User Id=skaev_app_user;Password=YourPassword;TrustServerCertificate=True;
```

### Node.js (mssql)
```javascript
{
  server: 'localhost',
  database: 'SkaEV',
  user: 'skaev_app_user',
  password: 'YourPassword',
  options: {
    encrypt: true,
    trustServerCertificate: true
  }
}
```

### Azure SQL Database
```
Server=tcp:yourserver.database.windows.net,1433;Database=SkaEV;User ID=skaev_app_user;Password=YourPassword;Encrypt=true;Connection Timeout=30;
```

## 🧪 Sample Queries

### Find nearest stations
```sql
DECLARE @userLat DECIMAL(10,8) = 10.7769;
DECLARE @userLon DECIMAL(11,8) = 106.7009;
DECLARE @userLocation GEOGRAPHY = geography::Point(@userLat, @userLon, 4326);

SELECT TOP 10
    name,
    address,
    @userLocation.STDistance(location) / 1000.0 AS distance_km,
    available_ports,
    rating_overall
FROM charging_stations
WHERE status = 'active'
  AND available_ports > 0
ORDER BY @userLocation.STDistance(location);
```

### Get active bookings with charging progress
```sql
SELECT * FROM v_active_bookings
WHERE customer_id = @customerId
ORDER BY created_at DESC;
```

### Calculate charging cost
```sql
SELECT 
    b.id,
    b.energy_delivered_kwh,
    dbo.fn_get_current_price(b.station_id, 'dc') AS rate_per_kwh,
    b.energy_delivered_kwh * dbo.fn_get_current_price(b.station_id, 'dc') AS energy_cost
FROM bookings b
WHERE b.id = @bookingId;
```

## 📚 Additional Resources

- [SQL Server Geography Type](https://learn.microsoft.com/en-us/sql/t-sql/spatial-geography/spatial-types-geography)
- [JSON Support in SQL Server](https://learn.microsoft.com/en-us/sql/relational-databases/json/json-data-sql-server)
- [Triggers in SQL Server](https://learn.microsoft.com/en-us/sql/relational-databases/triggers/dml-triggers)
- [Filtered Indexes](https://learn.microsoft.com/en-us/sql/relational-databases/indexes/create-filtered-indexes)

## ✅ Post-Deployment Checklist

- [ ] All tables created successfully
- [ ] All indexes created
- [ ] All triggers created
- [ ] All functions created
- [ ] All views created
- [ ] Sample queries run successfully
- [ ] Application user created and granted permissions
- [ ] Connection string tested
- [ ] Backup plan configured

## 🐛 Known Issues & Solutions

### Issue 1: Computed Geography Column Error
**Error**: Cannot create computed column with geography type

**Solution**: Ensure SQL Server 2012+ and spatial types enabled

### Issue 2: JSON Functions Not Found
**Error**: Invalid function ISJSON

**Solution**: Requires SQL Server 2016+. For older versions, remove JSON checks.

### Issue 3: Filtered Index on BIT Column
**Error**: Cannot create filtered index

**Solution**: Already handled in schema - using `WHERE column = 1` syntax

---

**Last Updated**: October 2025  
**Schema Version**: 1.0 (MSSQL)
