# 🧪 Hướng dẫn Test Cập nhật Profile Staff

## ✅ Đã sửa

### 1. Lỗi không hiển thị dữ liệu sau khi lưu
**Nguyên nhân**: `setTimeout(() => loadStaffProfile())` gọi lại và parse lại tên từ authUser cũ

**Giải pháp**: Cập nhật trực tiếp `profileData` từ response API, không reload

### 2. Đồng bộ dữ liệu với Admin
**Xác nhận**: 
- ✅ Staff cập nhật: `PUT /UserProfiles/me` → Cập nhật bảng `Users` (FullName, PhoneNumber)
- ✅ Admin đọc: `GET /admin/AdminUsers/{userId}` → Đọc từ bảng `Users`
- ✅ **Dữ liệu đồng bộ ngay lập tức**

---

## 🧪 Kịch bản Test

### Test Case 1: Cập nhật thông tin Staff
**Bước 1**: Đăng nhập với tài khoản Staff
- Email: `staff@skaev.com`
- Password: `Staff@123`

**Bước 2**: Vào trang Profile (`/staff/profile`)
- Kiểm tra thông tin hiện tại:
  - Họ: `Thành`
  - Tên: `Đạt`
  - Số điện thoại: `0000000000`

**Bước 3**: Nhấn nút "Chỉnh sửa hồ sơ"
- Thay đổi:
  - Họ: `Nguyễn Thành`
  - Tên: `Đạt Update`
  - Số điện thoại: `0987654321`

**Bước 4**: Nhấn "Lưu"

**Kết quả mong đợi**:
- ✅ Hiển thị thông báo "Thông tin đã được cập nhật thành công!"
- ✅ Dữ liệu mới hiển thị ngay lập tức (không mất)
- ✅ Tên hiển thị ở header: "Nguyễn Thành Đạt Update"
- ✅ Số điện thoại: "0987654321"

---

### Test Case 2: Kiểm tra đồng bộ với Admin

**Bước 1**: Sau khi Staff cập nhật (Test Case 1), đăng xuất

**Bước 2**: Đăng nhập với tài khoản Admin
- Email: `admin@skaev.com`
- Password: `Admin@123`

**Bước 3**: Vào trang User Management (`/admin/users`)

**Bước 4**: Tìm user "Thành Đạt" (staff)
- Click vào tên để xem chi tiết

**Kết quả mong đợi**:
- ✅ Tên hiển thị: "Nguyễn Thành Đạt Update"
- ✅ Số điện thoại: "0987654321"
- ✅ **Dữ liệu trùng khớp với Staff Profile**

---

### Test Case 3: Các trường không cho phép sửa

**Bước 1**: Đăng nhập Staff, vào Profile, nhấn "Chỉnh sửa hồ sơ"

**Kết quả mong đợi**:
- ✅ **Có thể sửa**:
  - Họ
  - Tên
  - Số điện thoại

- 🔒 **Chỉ đọc (disabled)**:
  - Email
  - Địa điểm
  - Ngày vào làm
  - Mã nhân viên
  - Phòng ban
  - Chức vụ

---

## 🐛 Cách kiểm tra lỗi

### Mở Console (F12)
Khi lưu thành công, bạn sẽ thấy:
```
💾 Saving profile data: {fullName: "Nguyễn Thành Đạt Update", phoneNumber: "0987654321"}
✅ Profile updated: {data: {userId: ..., fullName: "...", phoneNumber: "..."}}
```

### Nếu có lỗi, kiểm tra:
1. Backend có chạy không? (`http://localhost:5000`)
2. Token có hợp lệ không? (Thử đăng nhập lại)
3. Console có báo lỗi 401/403/405 không?

---

## 📊 Database Verification

Nếu muốn kiểm tra trực tiếp database:

```sql
-- Kiểm tra thông tin Staff user
SELECT 
    UserId,
    Email,
    FullName,
    PhoneNumber,
    Role,
    UpdatedAt
FROM Users
WHERE Email = 'staff@skaev.com';
```

**Sau khi Staff cập nhật, `FullName` và `PhoneNumber` sẽ thay đổi trong database**

---

## ✨ Tóm tắt

| Tính năng | Trạng thái | Ghi chú |
|-----------|-----------|---------|
| Cập nhật Họ, Tên | ✅ Hoạt động | Gửi `fullName` đến API |
| Cập nhật Số điện thoại | ✅ Hoạt động | Gửi `phoneNumber` đến API |
| Hiển thị dữ liệu mới | ✅ Hoạt động | Cập nhật ngay, không reload |
| Đồng bộ với Admin | ✅ Hoạt động | Cùng đọc từ bảng Users |
| Email (chỉ đọc) | ✅ Hoạt động | Không cho phép sửa |
| Địa điểm (chỉ đọc) | ✅ Hoạt động | Không cho phép sửa |

---

## 🎯 API Endpoint

```
PUT /api/UserProfiles/me
Authorization: Bearer {token}

Request Body:
{
  "fullName": "Nguyễn Thành Đạt Update",
  "phoneNumber": "0987654321"
}

Response:
{
  "userId": 123,
  "email": "staff@skaev.com",
  "fullName": "Nguyễn Thành Đạt Update",
  "phoneNumber": "0987654321",
  "role": "staff",
  "status": "active",
  ...
}
```
