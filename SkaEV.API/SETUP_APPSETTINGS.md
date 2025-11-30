# Hướng dẫn Setup File Cấu hình (appsettings)

## ⚠️ Quan trọng

Các file `appsettings.json`, `appsettings.Development.json`, và `appsettings.SQLite.json` đã được thêm vào `.gitignore` để tránh xung đột cấu hình giữa các máy khác nhau của các thành viên trong nhóm.

## 📋 Các bước setup khi clone repository

### 1. Copy file template

Sau khi clone repository về, bạn cần tạo các file cấu hình của riêng mình:

```powershell
# Tại thư mục SkaEV.API
cd SkaEV.API

# Copy file appsettings.json
Copy-Item "appsettings.json.example" -Destination "appsettings.json"

# Copy file appsettings.Development.json (nếu chưa có)
Copy-Item "appsettings.Development.json.example" -Destination "appsettings.Development.json"

# Copy file appsettings.SQLite.json (nếu dùng SQLite)
Copy-Item "appsettings.SQLite.json.example" -Destination "appsettings.SQLite.json"
```

### 2. Cập nhật Connection String

Mở file `appsettings.json` hoặc `appsettings.Development.json` và cập nhật Connection String phù hợp với máy của bạn:

**Với SQL Server:**

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=TÊN_MÁY_CỦA_BẠN\\SQLEXPRESS;Database=SkaEV_DB;Trusted_Connection=True;TrustServerCertificate=True;MultipleActiveResultSets=true"
  }
}
```

**Với SQLite:**

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Data Source=SkaEV.db"
  }
}
```

### 3. Kiểm tra tên SQL Server

Để lấy tên SQL Server của bạn:

1. Mở **SQL Server Management Studio (SSMS)**
2. Tên server sẽ hiển thị khi bạn connect (ví dụ: `DESKTOP-ABC123\SQLEXPRESS`)
3. Hoặc chạy command trong PowerShell:
   ```powershell
   sqlcmd -L
   ```

## 🔒 Các file được gitignore

Các file sau **KHÔNG** được push lên Git:

- ✅ `appsettings.json` - Cấu hình production
- ✅ `appsettings.Development.json` - Cấu hình development
- ✅ `appsettings.SQLite.json` - Cấu hình SQLite
- ✅ `appsettings.*.json` - Tất cả các file appsettings khác

Các file template **ĐƯỢC** push lên Git:

- 📄 `appsettings.json.example`
- 📄 `appsettings.Development.json.example`
- 📄 `appsettings.SQLite.json.example`

## 🚀 Khi pull code mới

Khi pull code từ Git về:

1. Các file cấu hình của bạn (`appsettings.json`, `appsettings.Development.json`) sẽ **KHÔNG** bị ghi đè
2. Bạn **KHÔNG** cần lo lắng về việc connection string bị thay đổi
3. Nếu có thêm cấu hình mới, file `.example` sẽ được cập nhật → bạn chỉ cần copy cấu hình mới vào file của mình

## 💡 Tips

- Luôn kiểm tra file `.example` sau khi pull để xem có cấu hình mới nào không
- Nếu backend không chạy được, kiểm tra lại connection string trong file `appsettings.json`
- Có thể dùng SQLite để test nhanh không cần SQL Server

## ❓ Troubleshooting

**Lỗi: "Cannot open database"**

- Kiểm tra tên server trong connection string
- Kiểm tra SQL Server đã chạy chưa
- Kiểm tra database `SkaEV_DB` đã được tạo chưa

**Lỗi: "A connection was successfully established..."**

- Thêm `TrustServerCertificate=True` vào connection string

**File appsettings không tồn tại:**

- Copy từ file `.example` như hướng dẫn ở trên
