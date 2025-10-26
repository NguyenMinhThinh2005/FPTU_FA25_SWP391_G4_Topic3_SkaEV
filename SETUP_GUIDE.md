# Setup Instructions for Team Members

## Backend Configuration

### 1. Database Connection Setup

Sau khi clone project, bạn cần tạo file cấu hình riêng:

1. **Copy file template**:
   ```bash
   cd SkaEV.API
   copy appsettings.template.json appsettings.json
   ```

2. **Cập nhật connection string** trong `appsettings.json`:
   - Mở file `SkaEV.API/appsettings.json`
   - Thay `YOUR_SERVER_NAME` bằng tên SQL Server của bạn
   - Ví dụ:
     - `Server=localhost;Database=SkaEV_DB;...` (nếu dùng SQL Server local)
     - `Server=TDAT\\SQLEXPRESS;Database=SkaEV_DB;...` (nếu dùng SQL Express)
     - `Server=(localdb)\\mssqllocaldb;Database=SkaEV_DB;...` (nếu dùng LocalDB)

### 2. Files cần tránh commit

⚠️ **KHÔNG commit các file sau**:
- `SkaEV.API/appsettings.json` - Connection string riêng của từng người
- `SkaEV.API/appsettings.Development.json` - Cấu hình dev cá nhân
- `database/delete_users_*.sql` - Scripts test/delete data
- `database/local_*.sql` - Scripts local
- `.azure/*.md` - Documentation files (trừ README.md)

✅ **An toàn để commit**:
- `SkaEV.API/appsettings.template.json` - Template cho team
- `src/**/*.jsx` - React components
- `src/**/*.js` - JavaScript files
- `database/schema.sql` - Database schema
- `database/seed_data.sql` - Initial data

### 3. Kiểm tra trước khi commit

Trước khi commit, chạy lệnh:
```bash
git status
```

Nếu thấy `appsettings.json` trong danh sách, đừng commit file này!

### 4. Setup Database

1. Tạo database `SkaEV_DB` trong SQL Server
2. Chạy các script trong thư mục `database/` theo thứ tự:
   - `schema.sql` - Tạo tables
   - `seed_data.sql` - Thêm data mẫu
   - Hoặc chạy script tạo test accounts: `create-test-accounts.ps1`

## Frontend Configuration

Frontend không có file cấu hình đặc biệt, nhưng đảm bảo:
- Backend chạy trên `http://localhost:5000`
- Frontend chạy trên `http://localhost:5173`

Nếu backend port khác, cập nhật trong `src/services/api.js`:
```javascript
const BASE_URL = "http://localhost:YOUR_PORT";
```

## Common Issues

### Issue 1: Connection String Error
**Lỗi**: Cannot connect to database
**Giải pháp**: Kiểm tra lại server name trong `appsettings.json`

### Issue 2: Port Already in Use
**Lỗi**: Port 5000 is already in use
**Giải pháp**: 
- Đổi port trong `Properties/launchSettings.json`
- Hoặc kill process đang dùng port 5000

### Issue 3: Database Not Found
**Lỗi**: Cannot open database "SkaEV_DB"
**Giải pháp**: Chạy lại database scripts để tạo database

## Workflow Recommendation

1. **Pull code mới**:
   ```bash
   git pull origin develop
   ```

2. **Kiểm tra cấu hình**:
   - Đảm bảo `appsettings.json` có connection string đúng
   - Chạy backend để test

3. **Làm việc với code**:
   - Chỉnh sửa code
   - Test trên local

4. **Commit code**:
   ```bash
   git status  # Kiểm tra files sẽ commit
   git add src/  # Chỉ add files code
   git add SkaEV.API/*.cs  # Add backend code
   git commit -m "Your message"
   git push origin develop
   ```

5. **TRÁNH commit**:
   ```bash
   git add .  # KHÔNG dùng lệnh này vì sẽ add tất cả files!
   git add SkaEV.API/appsettings.json  # KHÔNG commit file này!
   ```

## Contact

Nếu gặp vấn đề, liên hệ team lead hoặc tạo issue trên GitHub.
