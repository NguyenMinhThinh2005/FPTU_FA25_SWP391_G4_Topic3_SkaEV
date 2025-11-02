# 🔐 HƯỚNG DẪN RESET PASSWORD CHO TÀI KHOẢN CỦA BẠN

## ⚠️ VẤN ĐỀ

Các tài khoản gốc trong database của bạn có password khác nhau:

- ✅ Tài khoản mới tạo (admin2, staff, customer) có password: `Admin@123`
- ❌ Tài khoản gốc (nguyenvanan, thinh100816, quockhoatg202012) có password cũ

---

## 🚀 GIẢI PHÁP: 3 CÁCH RESET PASSWORD

### 🎯 Cách 1: Script PowerShell Tự Động (KHUYẾN NGHỊ)

```powershell
# Chạy script và làm theo hướng dẫn
.\quick-reset-password.ps1
```

**Hoặc chỉ định email trực tiếp:**

```powershell
.\quick-reset-password.ps1 -Email "nguyenvanan@gmail.com"
```

Script sẽ:

1. Hiển thị danh sách tài khoản
2. Hỏi email của bạn
3. Reset password thành `Admin@123`
4. Test login tự động

---

### 📝 Cách 2: Script SQL Đơn Giản

1. Mở file: `database\reset-password-simple.sql`
2. Tìm dòng:
   ```sql
   DECLARE @YourEmail NVARCHAR(255) = 'YOUR_EMAIL_HERE';
   ```
3. Sửa thành email của bạn:
   ```sql
   DECLARE @YourEmail NVARCHAR(255) = 'nguyenvanan@gmail.com';
   ```
4. Chạy script:
   ```powershell
   sqlcmd -S "ADMIN-PC\MSSQLSERVER01" -d SkaEV_DB -i "database\reset-password-simple.sql"
   ```

---

### 💻 Cách 3: SQL Command Trực Tiếp

```powershell
# Thay YOUR_EMAIL bằng email của bạn
sqlcmd -S "ADMIN-PC\MSSQLSERVER01" -d SkaEV_DB -Q "UPDATE Users SET password_hash = '$2a$11$fTrbXLCzcyIjORlsiR4qDeaxYxv2j1AQLncLIlS9sqXBf5c.kX4oK', updated_at = GETDATE() WHERE email = 'YOUR_EMAIL@gmail.com'"
```

**Ví dụ cụ thể:**

```powershell
# Reset password cho nguyenvanan@gmail.com
sqlcmd -S "ADMIN-PC\MSSQLSERVER01" -d SkaEV_DB -Q "UPDATE Users SET password_hash = '$2a$11$fTrbXLCzcyIjORlsiR4qDeaxYxv2j1AQLncLIlS9sqXBf5c.kX4oK', updated_at = GETDATE() WHERE email = 'nguyenvanan@gmail.com'"
```

---

## 📋 DANH SÁCH TÀI KHOẢN CẦN RESET

Các tài khoản này hiện tại **KHÔNG** dùng password `Admin@123`:

| User ID | Email                      | Role     | Action       |
| ------- | -------------------------- | -------- | ------------ |
| 1       | nguyenvanan@gmail.com      | Customer | 🔧 Cần reset |
| 2       | thinh100816@gmail.com      | Customer | 🔧 Cần reset |
| 4       | quockhoatg202012@gmail.com | Customer | 🔧 Cần reset |

---

## ✅ TÀI KHOẢN ĐÃ SẴN SÀNG (Dùng ngay được)

Các tài khoản này **ĐÃ** có password `Admin@123`:

| Email              | Password  | Role     |
| ------------------ | --------- | -------- |
| admin2@skaev.com   | Admin@123 | Admin    |
| thinh@gmail.com    | Admin@123 | Admin    |
| staff@skaev.com    | Admin@123 | Staff    |
| customer@skaev.com | Admin@123 | Customer |
| test@skaev.com     | Admin@123 | Customer |

---

## 🎯 DEMO NHANH

### Reset password cho nguyenvanan@gmail.com

```powershell
# Cách 1: Dùng script PowerShell
.\quick-reset-password.ps1 -Email "nguyenvanan@gmail.com"

# Cách 2: Dùng SQL trực tiếp
sqlcmd -S "ADMIN-PC\MSSQLSERVER01" -d SkaEV_DB -Q "UPDATE Users SET password_hash = '$2a$11$fTrbXLCzcyIjORlsiR4qDeaxYxv2j1AQLncLIlS9sqXBf5c.kX4oK', updated_at = GETDATE() WHERE email = 'nguyenvanan@gmail.com'"
```

### Test login sau khi reset

```powershell
# Test qua PowerShell
$body = @{ email = "nguyenvanan@gmail.com"; password = "Admin@123" } | ConvertTo-Json
Invoke-WebRequest -Uri "http://localhost:5000/api/auth/login" -Method POST -ContentType "application/json" -Body $body -UseBasicParsing
```

---

## 🔍 KIỂM TRA PASSWORD HASH

Xem password hash hiện tại của tài khoản:

```powershell
# Xem tất cả users
sqlcmd -S "ADMIN-PC\MSSQLSERVER01" -d SkaEV_DB -Q "SELECT user_id, email, role, LEFT(password_hash, 30) as hash_preview FROM Users"

# Xem user cụ thể
sqlcmd -S "ADMIN-PC\MSSQLSERVER01" -d SkaEV_DB -Q "SELECT email, LEFT(password_hash, 50) as hash_preview FROM Users WHERE email = 'nguyenvanan@gmail.com'"
```

**Password hash đúng cho `Admin@123`:**

```
$2a$11$fTrbXLCzcyIjORlsiR4qDeaxYxv2j1AQLncLIlS9sqXBf5c.kX4oK
```

---

## 🛠️ XỬ LÝ LỖI

### Lỗi: "Cannot open database"

```powershell
# Kiểm tra SQL Server đã chạy chưa
sqlcmd -S "ADMIN-PC\MSSQLSERVER01" -Q "SELECT @@VERSION"
```

### Lỗi: "User not found"

```powershell
# Xem danh sách users
sqlcmd -S "ADMIN-PC\MSSQLSERVER01" -d SkaEV_DB -Q "SELECT user_id, email FROM Users"
```

### Lỗi: "Invalid email or password" khi login

1. ✅ Đảm bảo đã reset password
2. ✅ Dùng đúng password: `Admin@123` (viết hoa chữ A)
3. ✅ Backend đang chạy (port 5000)
4. ✅ Frontend đang chạy (port 5173 hoặc 5174)

---

## 📞 TÓM TẮT

**Bạn muốn đăng nhập với tài khoản gốc của mình?**

### Bước 1: Reset password

```powershell
.\quick-reset-password.ps1
```

### Bước 2: Nhập email của bạn khi được hỏi

```
Nhập email của bạn: nguyenvanan@gmail.com
```

### Bước 3: Đăng nhập

- Truy cập: http://localhost:5173
- Email: (email của bạn)
- Password: `Admin@123`

---

## ✅ CHECKLIST

- [ ] Đã chạy script reset password
- [ ] Đã verify qua test login thành công
- [ ] Backend đang chạy (port 5000)
- [ ] Frontend đang chạy (port 5173/5174)
- [ ] Nhớ password mới: `Admin@123`
- [ ] Đã thử đăng nhập trên browser

---

**Lưu ý:** Tất cả các script trên sẽ set password thành `Admin@123` cho dễ nhớ và thống nhất với các tài khoản khác.

---

**Last Updated:** 02/11/2025  
**Status:** ✅ READY TO USE
