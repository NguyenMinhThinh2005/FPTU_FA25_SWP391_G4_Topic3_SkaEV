# 🎯 Real-time Sync - Quick Action Plan

## ✅ ĐÃ HOÀN THÀNH

### Database
- ✅ Fixed `sp_start_charging` - adds `current_booking_id`
- ✅ Tested: Booking #19 active, Staff can query it
- ✅ Database sync working correctly

### Backend Infrastructure
- ✅ SignalR Hub exists: `StationMonitoringHub.cs`
- ✅ SignalR enabled in `Program.cs`
- ✅ Notification service created: `StationNotificationService.cs`

## ⏳ CẦN LÀM TIẾP

### 1. Stop Backend API (URGENT!)
```powershell
# Find and kill process
taskkill /F /PID 17636

# OR in the terminal where it's running:
Ctrl+C
```

### 2. Install SignalR Client (Frontend)
```bash
cd d:\llll\ky5\SWP\prj1\FPTU_FA25_SWP391_G4_Topic3_SkaEV
npm install @microsoft/signalr
```

### 3. Create SignalR Service (Frontend)
Tạo file: `src/services/signalrService.js`
- Connect to `http://localhost:5000/hubs/station-monitoring`
- Listen for events: `ReceiveChargingUpdate`, `ReceiveStationUpdate`
- Provide subscribe/unsubscribe methods

### 4. Integrate into Staff Pages
**Dashboard.jsx, ChargingSessions.jsx, Monitoring.jsx:**
```javascript
useEffect(() => {
  signalRService.connect();
  
  const unsub = signalRService.subscribe('chargingUpdate', (data) => {
    loadDashboard(); // Refresh data
  });
  
  return () => unsub();
}, []);
```

### 5. Inject Notifications into Controllers (Backend)
**BookingsController.cs:**
```csharp
// Constructor
private readonly IStationNotificationService _notificationService;

// StartCharging method
if (success) {
  await _notificationService.NotifyChargingStarted(
    bookingId, stationId, slotId, connectorCode
  );
}
```

**InvoicesController.cs:**
```csharp
// ProcessPayment method
await _notificationService.NotifyPaymentCompleted(
  bookingId, stationId, slotId, connectorCode
);
```

## 🧪 Test Flow

### Scenario 1: Customer Start Charging
1. Customer: Click "Start Charging"
2. Backend: Execute `sp_start_charging` → Broadcast SignalR
3. Staff: Auto-refresh → See "Occupied"

### Scenario 2: Staff Process Payment
1. Staff: Click "Process Payment" → Submit
2. Backend: Update payment → Broadcast SignalR
3. Customer: Auto-update → See "Paid"

## 📁 Files to Edit

### Backend (5 files)
1. ~~Program.cs~~ ✅ Done
2. ~~StationNotificationService.cs~~ ✅ Done
3. BookingsController.cs - Add notification calls
4. InvoicesController.cs - Add notification calls
5. BookingService.cs - May need to return connector code

### Frontend (6 files)
1. signalrService.js - Create new
2. package.json - Add @microsoft/signalr
3. Dashboard.jsx - Add SignalR listener
4. ChargingSessions.jsx - Add SignalR listener
5. Monitoring.jsx - Add SignalR listener
6. ChargingFlow.jsx - Add SignalR listener (customer)

## 🚀 Priority Order

1. **NGAY BÂY GIỜ:** Stop backend process
2. **Bước 1:** Install `@microsoft/signalr` 
3. **Bước 2:** Create `signalrService.js`
4. **Bước 3:** Integrate into Staff Dashboard
5. **Bước 4:** Inject notifications in controllers
6. **Bước 5:** Rebuild & test

## 💡 Lưu Ý Quan Trọng

- SignalR chỉ hoạt động khi backend API đang chạy
- Frontend phải connect trước khi nhận events
- Mỗi page cần connect & cleanup properly
- Use `useEffect` cleanup to unsubscribe

## 📖 Chi Tiết

Xem file: `REALTIME_SYNC_IMPLEMENTATION.md`

---

**Current Status:** Backend code ready, API running (need stop & rebuild)  
**Next Action:** Stop backend → Install SignalR client → Create service  
**Estimated Time:** 30-45 minutes for full implementation
