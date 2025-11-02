# ✅ Git Configuration Checklist

## 🎯 Mục Đích

Đảm bảo code push lên Git có thể sử dụng được cho tất cả team members mà không bị conflict về cấu hình máy.

---

## ✅ Đã Hoàn Thành

### 1. Backend Configuration Files

| File                                   | Status     | Note                        |
| -------------------------------------- | ---------- | --------------------------- |
| `appsettings.json`                     | ✅ Ignored | Mỗi developer có file riêng |
| `appsettings.Development.json`         | ✅ Ignored | Mỗi developer có file riêng |
| `appsettings.*.json`                   | ✅ Ignored | Tất cả file config          |
| `appsettings.json.example`             | ✅ Tracked | Template cho team           |
| `appsettings.Development.json.example` | ✅ Tracked | Template cho team           |
| `appsettings.SQLite.json.example`      | ✅ Tracked | Template SQLite             |
| `appsettings.template.json`            | ✅ Fixed   | Đã xóa server name cụ thể   |

### 2. Frontend Configuration Files

| File             | Status     | Note                        |
| ---------------- | ---------- | --------------------------- |
| `.env`           | ✅ Ignored | Mỗi developer có file riêng |
| `.env.*`         | ✅ Ignored | Tất cả env files            |
| `.env.example`   | ✅ Tracked | Template cho team           |
| `axiosConfig.js` | ✅ Updated | Sử dụng env variable        |

### 3. Build Output & Dependencies

| Item              | Status     | Note              |
| ----------------- | ---------- | ----------------- |
| `node_modules/`   | ✅ Ignored | NPM dependencies  |
| `dist/`           | ✅ Ignored | Build output      |
| `SkaEV.API/bin/`  | ✅ Ignored | .NET build output |
| `SkaEV.API/obj/`  | ✅ Ignored | .NET obj files    |
| `SkaEV.API/logs/` | ✅ Ignored | Log files         |

### 4. IDE & Editor Files

| Item        | Status     | Note                             |
| ----------- | ---------- | -------------------------------- |
| `.vs/`      | ✅ Ignored | Visual Studio                    |
| `.vscode/*` | ✅ Ignored | VS Code (except extensions.json) |
| `*.user`    | ✅ Ignored | User-specific files              |
| `*.suo`     | ✅ Ignored | VS solution user options         |

### 5. Scripts (Machine-specific)

| Item             | Status       | Note                     |
| ---------------- | ------------ | ------------------------ |
| `*.ps1`          | ✅ Ignored   | PowerShell scripts       |
| `*.bat`          | ✅ Ignored   | Batch files              |
| `!*.example.ps1` | ✅ Exception | Template scripts tracked |
| `!*.example.bat` | ✅ Exception | Template scripts tracked |

### 6. Database Files

| Item                          | Status     | Note                  |
| ----------------------------- | ---------- | --------------------- |
| `database/local_*.sql`        | ✅ Ignored | Local scripts         |
| `database/temp_*.sql`         | ✅ Ignored | Temp scripts          |
| `database/delete_users_*.sql` | ✅ Ignored | Cleanup scripts       |
| `*.mdf`, `*.ldf`              | ✅ Ignored | SQL Server data files |

### 7. Documentation

| File                       | Status     | Note               |
| -------------------------- | ---------- | ------------------ |
| `README.md`                | ✅ Tracked | Main documentation |
| `SETUP_FOR_TEAM.md`        | ✅ Tracked | Setup guide        |
| `SETUP_DATABASE.md`        | ✅ Tracked | DB setup guide     |
| `API_INTEGRATION_GUIDE.md` | ✅ Tracked | API documentation  |
| `*_TEST_*.md`              | ✅ Ignored | Test documents     |
| `*_DEBUG_*.md`             | ✅ Ignored | Debug notes        |
| `COMPLETE_ACCOUNT_LIST.md` | ✅ Ignored | Contains passwords |

---

## 🔍 Verification Commands

### Kiểm tra file nào đang được track

```powershell
git ls-files | Select-String "appsettings"
git ls-files | Select-String "\.env"
git ls-files | Select-String "\.ps1"
```

### Kiểm tra file nào bị ignore

```powershell
git status --ignored
```

### Test xem file có bị track không

```powershell
git check-ignore -v appsettings.json
git check-ignore -v .env
```

---

## ⚠️ WARNING: Files KHÔNG BAO GIỜ Push

**TUYỆT ĐỐI KHÔNG** push các file sau:

1. ❌ `SkaEV.API/appsettings.json` - Chứa connection string của máy bạn
2. ❌ `SkaEV.API/appsettings.Development.json` - Config development riêng
3. ❌ `.env` - Chứa API URL và configs riêng
4. ❌ `*.user` files - User-specific Visual Studio settings
5. ❌ `node_modules/` - Quá lớn, npm install sẽ tạo lại
6. ❌ `bin/`, `obj/` - Build output, dotnet build sẽ tạo lại
7. ❌ `logs/` - Log files riêng của máy
8. ❌ `*.ps1`, `*.bat` - Scripts có thể chứa paths riêng

---

## ✅ Files PHẢI Track (Templates)

**Các file template này PHẢI** được push để team có thể copy:

1. ✅ `appsettings.json.example`
2. ✅ `appsettings.Development.json.example`
3. ✅ `appsettings.SQLite.json.example`
4. ✅ `.env.example`
5. ✅ `SETUP_FOR_TEAM.md`
6. ✅ `README.md`
7. ✅ `package.json`
8. ✅ `FPTU_FA25_SWP391_G4_Topic3_SkaEV.sln`

---

## 📝 Quy Trình Trước Khi Push

### 1. Kiểm tra status

```powershell
git status
```

### 2. Xem diff

```powershell
git diff
```

### 3. Đảm bảo không có file nhạy cảm

```powershell
# Nếu thấy các file này, KHÔNG add:
# - appsettings.json
# - .env
# - *.user
# - bin/, obj/
```

### 4. Add files an toàn

```powershell
# Add specific files
git add src/
git add SkaEV.API/Controllers/
git add SkaEV.API/Services/

# KHÔNG dùng git add . nếu chưa chắc chắn
```

### 5. Commit và push

```powershell
git commit -m "Your message"
git push origin your-branch
```

---

## 🧪 Test Checklist

Sau khi push code, test bằng cách:

### 1. Clone vào thư mục mới

```powershell
cd C:\Temp
git clone [repo-url] test-clone
cd test-clone
```

### 2. Kiểm tra files

```powershell
# Các file này KHÔNG được tồn tại trong clone mới:
Test-Path SkaEV.API/appsettings.json  # Phải False
Test-Path .env                         # Phải False

# Các file này PHẢI tồn tại:
Test-Path SkaEV.API/appsettings.json.example  # Phải True
Test-Path .env.example                         # Phải True
```

### 3. Setup theo hướng dẫn

```powershell
# Copy templates
Copy-Item SkaEV.API/appsettings.json.example SkaEV.API/appsettings.json
Copy-Item .env.example .env

# Sửa configs
# Edit appsettings.json với server name của máy test
# Edit .env nếu cần
```

### 4. Build và run

```powershell
# Backend
cd SkaEV.API
dotnet restore
dotnet build
dotnet run

# Frontend
cd ..
npm install
npm run dev
```

### 5. Verify

- [ ] Backend chạy thành công
- [ ] Frontend chạy thành công
- [ ] Login được vào admin dashboard
- [ ] Xem được dữ liệu từ database

---

## 📊 Summary

| Category         | Ignored | Tracked | Total |
| ---------------- | ------- | ------- | ----- |
| Backend Configs  | 3       | 3       | 6     |
| Frontend Configs | 2       | 1       | 3     |
| Build Outputs    | 4       | 0       | 4     |
| IDE Files        | 5       | 1       | 6     |
| Scripts          | Many    | Few     | -     |
| Documentation    | Some    | Most    | -     |

**Status:** ✅ **READY FOR TEAM COLLABORATION**

---

## 🎓 Best Practices

1. **Luôn check git status** trước khi commit
2. **Không bao giờ dùng git add -f** để force add file ignored
3. **Kiểm tra diff** trước khi push
4. **Test bằng clone mới** để đảm bảo team members có thể setup
5. **Update .gitignore** khi thêm file config mới
6. **Tạo .example files** cho mọi file config quan trọng
7. **Document setup process** rõ ràng trong README

---

## 📞 Support

Nếu phát hiện file config bị push nhầm:

1. **Remove from Git (keep local):**

   ```powershell
   git rm --cached path/to/file
   git commit -m "Remove config file from tracking"
   git push
   ```

2. **Add to .gitignore:**

   ```powershell
   echo "path/to/file" >> .gitignore
   git add .gitignore
   git commit -m "Add file to gitignore"
   git push
   ```

3. **Thông báo team:**
   - Notify team members về việc remove file
   - Hướng dẫn họ tạo file config riêng từ template

---

**Last Updated:** 2025-11-02
**Verified By:** Development Team
**Status:** ✅ Production Ready
