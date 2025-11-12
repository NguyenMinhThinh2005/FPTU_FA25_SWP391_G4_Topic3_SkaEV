# 🚨 Hướng dẫn Dừng khẩn cấp & Thanh toán

## ✨ Tính năng mới đã thêm

### 1. **Nút Dừng khẩn cấp** 🛑
- Hiển thị: Chỉ khi phiên sạc **đang hoạt động** (activeSession !== null)
- Màu sắc: Đỏ (error) 
- Icon: Stop icon
- Vị trí: Cột "Thao tác", bên cạnh nút "Chi tiết"

### 2. **Nút Thanh toán** 💰
- Hiển thị: Sau khi **dừng phiên sạc** (connector trống nhưng có bookingId)
- Màu sắc: Xanh lá (success)
- Icon: Payment icon
- Vị trí: Cột "Thao tác", thay thế nút "Dừng khẩn cấp"

---

## 📋 Luồng hoạt động

### **Kịch bản 1: Dừng khẩn cấp phiên sạc**

```
1. User click "Dừng khẩn cấp" trên row đang charging
   ↓
2. Dialog xác nhận hiện ra với thông tin:
   - Phiên sạc #123
   - Khách hàng: Nguyễn Văn A
   - Xe: VinFast VF8 - 29A-12345
   - Năng lượng đã sạc: 15.80 kWh
   - SOC hiện tại: 65%
   - Tổng tiền: 47,400 ₫
   ↓
3. User click "Xác nhận Dừng"
   ↓
4. Backend API được gọi:
   PUT /api/bookings/{bookingId}/complete
   Body: {
     finalSoc: 65,
     totalEnergyKwh: 15.80,
     unitPrice: 3000
   }
   ↓
5. Thông báo: "Đã dừng khẩn cấp phiên sạc #123. Vui lòng thanh toán."
   ↓
6. Reload sessions → Connector chuyển về "Sẵn sàng"
   ↓
7. Dialog thanh toán tự động mở sau 500ms
```

### **Kịch bản 2: Thanh toán trực tiếp**

```
1. User click "Thanh toán" trên row đã dừng
   ↓
2. Dialog thanh toán hiện ra với form:
   - SOC cuối cùng (%) - Pre-fill từ session
   - Tổng năng lượng (kWh) - Pre-fill từ session
   - Phương thức thanh toán (dropdown)
     ✓ Tiền mặt
     ✓ Thẻ
     ✓ MoMo
     ✓ VNPay
   ↓
3. User điều chỉnh thông tin (nếu cần) và chọn phương thức
   ↓
4. User click "Xác nhận Thanh toán"
   ↓
5. Backend API được gọi:
   PUT /api/bookings/{bookingId}
   Body: {
     paymentStatus: 'paid',
     paymentMethod: 'cash',
     paidAt: '2025-11-10T21:55:00Z'
   }
   ↓
6. Thông báo: "Thanh toán thành công cho phiên sạc #123!"
   ↓
7. Reload sessions → Connector về trạng thái ban đầu
```

---

## 🎨 UI Components

### **Emergency Stop Dialog**
```jsx
<Dialog>
  <DialogTitle bgcolor="error.main" color="white">
    🛑 Xác nhận Dừng khẩn cấp
  </DialogTitle>
  <DialogContent>
    ⚠️ Cảnh báo: Hành động này sẽ dừng ngay phiên sạc
    
    Phiên sạc: #123
    Khách hàng: Nguyễn Văn A
    Xe: VinFast VF8
    Năng lượng: 15.80 kWh
    SOC: 65%
    Tổng tiền: 47,400 ₫
  </DialogContent>
  <DialogActions>
    [Hủy]  [Xác nhận Dừng]
  </DialogActions>
</Dialog>
```

### **Payment Dialog**
```jsx
<Dialog maxWidth="sm" fullWidth>
  <DialogTitle bgcolor="success.main" color="white">
    💰 Thanh toán Phiên sạc
  </DialogTitle>
  <DialogContent>
    ℹ️ Phiên sạc #123 - Nguyễn Văn A
    
    [SOC cuối cùng (%)] ← Input number (0-100)
    [Tổng năng lượng (kWh)] ← Input number (step 0.01)
    [Phương thức thanh toán] ← Select dropdown
    
    ┌─────────────────────────────┐
    │ Tổng tiền: 47,400 ₫         │
    │ Đơn giá: 3,000 ₫/kWh        │
    └─────────────────────────────┘
  </DialogContent>
  <DialogActions>
    [Hủy]  [Xác nhận Thanh toán]
  </DialogActions>
</Dialog>
```

### **Snackbar Notifications**
```jsx
// Success
✅ Thanh toán thành công cho phiên sạc #123!

// Warning (after emergency stop)
⚠️ Đã dừng khẩn cấp phiên sạc #123. Vui lòng thanh toán.

// Error
❌ Không thể dừng phiên sạc
```

---

## 🔧 API Endpoints sử dụng

### **1. Complete Charging (Emergency Stop)**
```http
PUT /api/bookings/{bookingId}/complete
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json

{
  "finalSoc": 65,
  "totalEnergyKwh": 15.80,
  "unitPrice": 3000
}
```

**Response:**
```json
{
  "success": true,
  "message": "Charging session completed",
  "bookingId": 123,
  "invoice": {
    "invoiceId": 456,
    "totalAmount": 47400,
    "paymentStatus": "pending"
  }
}
```

### **2. Process Payment**
```http
PUT /api/bookings/{bookingId}
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json

{
  "paymentStatus": "paid",
  "paymentMethod": "cash",
  "paidAt": "2025-11-10T21:55:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment processed successfully",
  "bookingId": 123,
  "paymentStatus": "paid"
}
```

---

## 🧪 Test Cases

### **TC1: Emergency Stop Active Session**
**Precondition:** 
- Có ít nhất 1 connector đang sạc (operationalStatus = "Charging")
- activeSession !== null

**Steps:**
1. Vào trang "Quản lý Phiên sạc"
2. Tìm row có chip "Đang sạc" (màu xanh)
3. Click nút "Dừng khẩn cấp" (màu đỏ)
4. Verify dialog hiển thị đầy đủ thông tin
5. Click "Xác nhận Dừng"

**Expected:**
- ✅ Snackbar warning xuất hiện
- ✅ Sessions reload
- ✅ Connector chuyển về "Sẵn sàng"
- ✅ Dialog thanh toán tự động mở

---

### **TC2: Payment After Stop**
**Precondition:**
- Đã dừng phiên sạc thành công
- Dialog thanh toán đang mở

**Steps:**
1. Kiểm tra pre-filled values:
   - SOC cuối cùng
   - Tổng năng lượng
2. Chọn phương thức: "Tiền mặt"
3. Click "Xác nhận Thanh toán"

**Expected:**
- ✅ Snackbar success xuất hiện
- ✅ Sessions reload
- ✅ Booking status = "paid"

---

### **TC3: Manual Payment (Not from Emergency Stop)**
**Precondition:**
- Có connector đã dừng (có bookingId nhưng activeSession = null)

**Steps:**
1. Click nút "Thanh toán" (màu xanh)
2. Dialog mở với form trống
3. Nhập thông tin:
   - SOC: 80
   - Năng lượng: 20.5 kWh
   - Phương thức: MoMo
4. Verify tổng tiền tự động tính: 20.5 × 3000 = 61,500 ₫
5. Click "Xác nhận Thanh toán"

**Expected:**
- ✅ Payment processed
- ✅ Snackbar hiển thị

---

### **TC4: Cancel Actions**
**Test Cancel Emergency Stop:**
1. Click "Dừng khẩn cấp"
2. Dialog mở
3. Click "Hủy"
4. Verify: Dialog đóng, không có thay đổi

**Test Cancel Payment:**
1. Click "Thanh toán"
2. Dialog mở
3. Click "Hủy"
4. Verify: Dialog đóng, không có API call

---

## 📊 State Management

### **Component States**
```javascript
const [sessions, setSessions] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

// Dialog states
const [stopDialogOpen, setStopDialogOpen] = useState(false);
const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
const [selectedSession, setSelectedSession] = useState(null);

// Payment form
const [paymentForm, setPaymentForm] = useState({
  finalSoc: '',
  totalEnergyKwh: '',
  paymentMethod: 'cash'
});

// Notifications
const [snackbar, setSnackbar] = useState({
  open: false,
  message: '',
  severity: 'success'
});
```

### **Flow Diagram**
```
┌─────────────────────────────────────────────────────────┐
│                 ChargingSessions Page                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  [Active Session Row]                                   │
│  ┌──────────────────────────────────────────────────┐  │
│  │ #123 | CCS2 | Đang sạc | 15:30 | 2h 30m | ...    │  │
│  │ [Chi tiết] [Dừng khẩn cấp]                        │  │
│  └──────────────────────────────────────────────────┘  │
│                    ↓ Click                              │
│  ┌──────────────────────────────────────────────────┐  │
│  │        Emergency Stop Dialog                      │  │
│  │  ⚠️ Xác nhận dừng phiên sạc?                      │  │
│  │  [Hủy] [Xác nhận]                                 │  │
│  └──────────────────────────────────────────────────┘  │
│                    ↓ Xác nhận                           │
│  API: PUT /bookings/{id}/complete                       │
│                    ↓ Success                            │
│  ┌──────────────────────────────────────────────────┐  │
│  │        Payment Dialog (Auto-open)                 │  │
│  │  💰 Thanh toán phiên sạc                          │  │
│  │  [SOC] [Năng lượng] [Phương thức]                 │  │
│  │  [Hủy] [Xác nhận Thanh toán]                      │  │
│  └──────────────────────────────────────────────────┘  │
│                    ↓ Xác nhận                           │
│  API: PUT /bookings/{id} (payment)                      │
│                    ↓ Success                            │
│  ✅ Snackbar: "Thanh toán thành công!"                 │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 Validation Rules

### **Emergency Stop Dialog**
- ✅ Chỉ hiện khi `activeSession !== null`
- ✅ Hiển thị đầy đủ thông tin session
- ✅ Tính tổng tiền dựa trên `energyDelivered × 3000`

### **Payment Dialog**
- ✅ SOC: 0-100%
- ✅ Năng lượng: >= 0 kWh (step 0.01)
- ✅ Phương thức: Required (default: cash)
- ✅ Tổng tiền: Auto-calculate real-time

### **API Error Handling**
```javascript
try {
  await staffAPI.completeCharging(...);
} catch (err) {
  setSnackbar({
    open: true,
    message: err.message || "Không thể dừng phiên sạc",
    severity: 'error'
  });
}
```

---

## 🚀 Demo Scenario

### **Full Flow Test:**

1. **Login as Staff**
   ```
   Email: staff@skaev.com
   Password: Admin@123
   ```

2. **Navigate to Charging Sessions**
   ```
   http://localhost:5173/staff/charging-sessions
   ```

3. **Emergency Stop Flow**
   - Find row: "🔵 Đang sạc"
   - Click: "🛑 Dừng khẩn cấp"
   - Review info in dialog
   - Click: "Xác nhận Dừng"
   - Wait for auto-open payment dialog

4. **Payment Flow**
   - Verify pre-filled data
   - Select: "Tiền mặt"
   - Click: "💰 Xác nhận Thanh toán"
   - See success notification

5. **Refresh & Verify**
   - Click: "🔄 Làm mới"
   - Verify connector back to "Sẵn sàng"
   - Verify no active session

---

## 📌 Notes

### **Price Calculation**
```javascript
const pricePerKwh = 3000; // VND
const totalCost = energyKwh × pricePerKwh;
```

### **Auto-open Payment Dialog**
- Delay: 500ms after emergency stop success
- Reason: Smooth UX transition
- Can be manually opened by clicking "Thanh toán" button

### **Payment Methods**
- `cash` - Tiền mặt
- `card` - Thẻ
- `momo` - MoMo
- `vnpay` - VNPay

### **Button Visibility Logic**
```javascript
{isActive && <Button>Dừng khẩn cấp</Button>}
{!isActive && session.bookingId && <Button>Thanh toán</Button>}
```

---

## ✅ Checklist

- [x] Import MUI Dialog components
- [x] Add state management for dialogs
- [x] Create `handleEmergencyStop` function
- [x] Create `confirmEmergencyStop` function
- [x] Create `handlePayment` function
- [x] Create `processPayment` function
- [x] Add Emergency Stop Dialog UI
- [x] Add Payment Dialog UI
- [x] Add Snackbar notifications
- [x] Add buttons to table cell
- [x] Implement auto-open payment after stop
- [x] Add error handling
- [x] Test all flows

🎉 **Hoàn thành!** Trang Quản lý Phiên sạc giờ đã có đầy đủ chức năng Dừng khẩn cấp và Thanh toán!
