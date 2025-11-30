# 📊 Hướng dẫn Dashboard Staff - Hiển thị 4 Chỉ số

## ✅ Đã hoàn thành

### 1. **Logic tính toán thông minh**

Dashboard Staff đã được nâng cấp với logic tính toán 2 lớp:

#### **Lớp 1: Dữ liệu từ Backend API**
- API `/api/staff/dashboard` trả về `dailyStats`:
  ```json
  {
    "revenue": 300000,
    "completedSessions": 5,
    "energyDeliveredKwh": 125.5,
    "activeSessions": 2
  }
  ```

#### **Lớp 2: Tính toán Fallback từ Frontend**
Nếu API không trả về hoặc trả về `0`, frontend tự động tính toán từ `connectors`:

```javascript
// Tính số xe đang sạc
currentActiveSessions = connectors.filter(c => c.activeSession).length

// Tính năng lượng tiêu thụ
currentActiveEnergy = connectors.reduce((total, c) => {
  return total + (c.activeSession?.energyConsumedKwh || 0)
}, 0)

// Tính doanh thu
currentActiveRevenue = connectors.reduce((total, c) => {
  const energy = c.activeSession?.energyConsumedKwh || 0
  const rate = c.activeSession?.unitPrice || 5000
  return total + (energy * rate)
}, 0)
```

### 2. **4 Chỉ số hiển thị**

| Chỉ số | Màu sắc | Icon | Nguồn dữ liệu |
|--------|---------|------|---------------|
| **Doanh thu hôm nay (VNĐ)** | Gradient tím | 💰 MonetizationOn | `dailyStats.revenue` |
| **Phiên hoàn thành** | Gradient tím | ✅ CheckCircle | `dailyStats.completedSessions` |
| **Năng lượng tiêu thụ (kWh)** | Gradient hồng | ⚡ Bolt | `dailyStats.energyConsumed` |
| **Số lượng Xe đang sạc** | Gradient xanh | 🔋 BatteryChargingFull | `dailyStats.activeSessions` |

### 3. **Thiết kế UI đã cải tiến**

```jsx
<Card sx={{ 
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  color: 'white'
}}>
  <CardContent>
    <Box display="flex" alignItems="center" justifyContent="space-between">
      <Box>
        <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
          Doanh thu hôm nay (VNĐ)
        </Typography>
        <Typography variant="h4" fontWeight="bold">
          {Number(dailyStats.revenue || 0).toLocaleString('vi-VN')}
        </Typography>
      </Box>
      <MonetizationOn sx={{ fontSize: 48, opacity: 0.8 }} />
    </Box>
  </CardContent>
</Card>
```

## 🔍 Cách dữ liệu được tính toán

### Backend Logic (StaffDashboardService.cs)

```csharp
// Doanh thu = Tổng invoice đã thanh toán hôm nay
Revenue = todaysInvoices
    .Where(i => i.PaymentStatus == "paid")
    .Sum(i => i.TotalAmount)

// Phiên hoàn thành = Booking status = "completed" hôm nay
CompletedSessions = todaysBookings
    .Count(b => b.Status == "completed")

// Năng lượng = Tổng kWh từ invoice
EnergyDeliveredKwh = todaysInvoices.Sum(i => i.TotalEnergyKwh)

// Xe đang sạc = Booking status = "in_progress"
ActiveSessions = await _context.Bookings
    .Where(b => b.StationId == stationId && b.Status == "in_progress")
    .CountAsync()
```

### Frontend Fallback (Dashboard.jsx)

```javascript
// Nếu API trả về 0 hoặc null, tính từ connectors
normalizedConnectors.forEach((connector) => {
  if (connector.activeSession) {
    currentActiveSessions += 1;
    
    const energyKwh = Number(session.energyConsumedKwh || 0);
    currentActiveEnergy += energyKwh;
    
    const rate = Number(session.unitPrice || 5000);
    currentActiveRevenue += energyKwh * rate;
  }
});
```

## 🧪 Test dữ liệu

### Bước 1: Chạy SQL script tạo dữ liệu mẫu

```powershell
sqlcmd -S "TDAT\SQLEXPRESS" -d "SkaEV_DB" -i test-staff-dashboard-data.sql
```

Script sẽ tạo:
- ✅ 1 booking hoàn thành với doanh thu 300,000 VND
- ✅ 1 booking đang sạc (in_progress) với 25 kWh
- ✅ Invoices và SoC tracking tương ứng

### Bước 2: Kiểm tra Database

```sql
-- Kiểm tra booking hoàn thành hôm nay
SELECT COUNT(*) FROM Bookings 
WHERE Status = 'completed' 
    AND CAST(ActualStartTime AS DATE) = CAST(GETDATE() AS DATE);

-- Kiểm tra doanh thu
SELECT SUM(TotalAmount) FROM Invoices 
WHERE PaymentStatus = 'paid' 
    AND CAST(CreatedAt AS DATE) = CAST(GETDATE() AS DATE);

-- Kiểm tra xe đang sạc
SELECT COUNT(*) FROM Bookings WHERE Status = 'in_progress';
```

### Bước 3: Refresh Staff Dashboard

1. Đăng nhập role **Staff** (`staff@skaev.com` / `Admin@123`)
2. Click nút **"Làm mới"** 
3. Kiểm tra 4 chỉ số đã hiển thị đúng

## 📝 Kỳ vọng kết quả

Sau khi chạy test script, Dashboard sẽ hiển thị:

| Chỉ số | Giá trị kỳ vọng |
|--------|-----------------|
| Doanh thu | 300,000 VND (hoặc cao hơn) |
| Phiên hoàn thành | 1 (hoặc nhiều hơn) |
| Năng lượng tiêu thụ | 60.0 kWh (hoặc cao hơn) |
| Xe đang sạc | 1 (hoặc nhiều hơn) |

## 🔧 Troubleshooting

### Vấn đề: Tất cả chỉ số đều là 0

**Nguyên nhân:**
- Chưa có booking nào hoàn thành hôm nay
- Chưa có booking nào đang sạc
- Database chưa có dữ liệu

**Giải pháp:**
1. Chạy `test-staff-dashboard-data.sql` để tạo dữ liệu mẫu
2. Hoặc tạo booking thực tế từ role Customer

### Vấn đề: Doanh thu = 0 nhưng có booking hoàn thành

**Nguyên nhân:**
- Invoice chưa được tạo
- PaymentStatus chưa là "paid"

**Giải pháp:**
```sql
-- Kiểm tra invoice
SELECT * FROM Invoices WHERE BookingId IN (
    SELECT BookingId FROM Bookings WHERE Status = 'completed'
);

-- Update payment status
UPDATE Invoices SET PaymentStatus = 'paid' 
WHERE PaymentStatus != 'paid';
```

### Vấn đề: Xe đang sạc = 0 nhưng Customer đã Start Charging

**Nguyên nhân:**
- Booking.Status chưa chuyển sang "in_progress"
- ChargingSlot.CurrentBookingId chưa được update

**Giải pháp:**
Kiểm tra backend BookingsController:
```csharp
// Trong PUT /api/bookings/{id}/start
booking.Status = "in_progress";
booking.Slot.CurrentBookingId = bookingId;
booking.Slot.Status = "in_use";
await _context.SaveChangesAsync();
```

## 🎨 Tùy chỉnh giao diện

### Thay đổi màu sắc gradient

```jsx
// Doanh thu - Màu xanh
background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'

// Phiên hoàn thành - Màu cam
background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'

// Năng lượng - Màu vàng
background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)'

// Xe đang sạc - Màu xanh dương
background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
```

### Thay đổi format số

```javascript
// Format với dấu phẩy (123,456)
{Number(value).toLocaleString('vi-VN')}

// Format với 2 chữ số thập phân (123.45)
{Number(value).toFixed(2)}

// Format tiền tệ đầy đủ (123.456 ₫)
{new Intl.NumberFormat('vi-VN', { 
  style: 'currency', 
  currency: 'VND' 
}).format(value)}
```

## 📊 Dữ liệu mẫu cho từng chỉ số

### 1. Doanh thu hôm nay
```sql
-- Tạo invoice đã thanh toán
INSERT INTO Invoices (BookingId, InvoiceCode, TotalAmount, PaymentStatus, CreatedAt)
VALUES (1, 'INV001', 300000, 'paid', GETDATE());
```

### 2. Phiên hoàn thành
```sql
-- Tạo booking hoàn thành
UPDATE Bookings SET 
    Status = 'completed',
    ActualStartTime = DATEADD(HOUR, -2, GETDATE()),
    ActualEndTime = DATEADD(HOUR, -1, GETDATE())
WHERE BookingId = 1;
```

### 3. Năng lượng tiêu thụ
```sql
-- Update năng lượng trong invoice
UPDATE Invoices SET TotalEnergyKwh = 60.5 WHERE InvoiceId = 1;
```

### 4. Xe đang sạc
```sql
-- Tạo booking đang sạc
UPDATE Bookings SET 
    Status = 'in_progress',
    ActualStartTime = DATEADD(MINUTE, -30, GETDATE())
WHERE BookingId = 2;

-- Link slot với booking
UPDATE ChargingSlots SET CurrentBookingId = 2 WHERE SlotId = 1;
```

## ✨ Tính năng nâng cao đã implement

1. **Auto-calculation**: Tự động tính toán nếu API không trả dữ liệu
2. **Real-time update**: Click "Làm mới" để cập nhật ngay lập tức
3. **Format số Việt Nam**: Dấu phẩy ngăn cách hàng nghìn
4. **Responsive design**: Tự động điều chỉnh trên mobile/tablet
5. **Gradient cards**: Màu sắc gradient đẹp mắt phân biệt từng chỉ số
6. **Icon phù hợp**: Mỗi chỉ số có icon riêng trực quan

## 🚀 Next Steps

1. ✅ Test với dữ liệu thực tế từ Customer
2. ✅ Kiểm tra tính chính xác của các phép tính
3. ⏳ Thêm biểu đồ (charts) cho từng chỉ số theo thời gian
4. ⏳ Export báo cáo PDF/Excel
5. ⏳ Thông báo real-time khi có booking mới

---

**Tác giả:** GitHub Copilot  
**Ngày cập nhật:** 10/11/2025  
**Version:** 1.0
