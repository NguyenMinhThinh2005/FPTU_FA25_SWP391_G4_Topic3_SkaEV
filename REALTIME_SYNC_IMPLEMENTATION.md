# 🔄 Real-time Synchronization Implementation Guide

## 📋 Tổng Quan

Hệ thống cần **real-time synchronization** giữa Customer và Staff UI:
- Customer sạc xe → Staff thấy ngay trạng thái "đang sạc"
- Customer dừng sạc → Staff thấy "hoàn thành, chờ thanh toán"
- Customer thanh toán → Staff thấy connector "rảnh"
- Staff xử lý thanh toán → Customer thấy phiên sạc hoàn tất

## ✅ Đã Có Sẵn

### Backend (SignalR Hub)
- ✅ `StationMonitoringHub.cs` - SignalR Hub for broadcasting
- ✅ `builder.Services.AddSignalR()` - Service registered
- ✅ `app.MapHub<StationMonitoringHub>("/hubs/station-monitoring")` - Endpoint mapped

### Database Fix
- ✅ `sp_start_charging` updated with `current_booking_id`
- ✅ Database synchronization working

## 🔧 Implementation Steps

### Step 1: Enable SignalR Backend (DONE ✅)

**File:** `SkaEV.API/Program.cs`

```csharp
// Line 8: Uncommented
using SkaEV.API.Hubs;

// Line 250: Uncommented
app.MapHub<StationMonitoringHub>("/hubs/station-monitoring");
```

### Step 2: Create Notification Service (DONE ✅)

**File:** `SkaEV.API/Application/Services/StationNotificationService.cs`

Events:
- `NotifyChargingStarted()` - Broadcast khi customer bắt đầu sạc
- `NotifyChargingCompleted()` - Broadcast khi customer dừng sạc
- `NotifyPaymentCompleted()` - Broadcast khi thanh toán xong
- `NotifySlotStatusChange()` - Broadcast khi slot status thay đổi

### Step 3: Inject Notifications into Controllers

#### BookingsController.cs - StartCharging

**Location:** Line ~194

```csharp
[HttpPut("{id}/start")]
public async Task<IActionResult> StartCharging(int id)
{
    try
    {
        // ... existing authorization code ...
        
        var booking = await _bookingService.GetBookingByIdAsync(id);
        var success = await _bookingService.StartChargingAsync(id);
        
        if (success)
        {
            // 🔔 BROADCAST REAL-TIME UPDATE
            await _notificationService.NotifyChargingStarted(
                booking.BookingId,
                booking.StationId,
                booking.SlotId,
                booking.ConnectorCode // Get from joined slot data
            );
        }
        
        return Ok(new { message = "Charging started successfully" });
    }
    catch (Exception ex) { /* ... */ }
}
```

#### BookingsController.cs - CompleteCharging

**Location:** Line ~236

```csharp
[HttpPut("{id}/complete")]
public async Task<IActionResult> CompleteCharging(int id, [FromBody] CompleteChargingDto dto)
{
    try
    {
        // ... existing code ...
        
        var booking = await _bookingService.GetBookingByIdAsync(id);
        var success = await _bookingService.CompleteChargingAsync(id, dto.FinalSoc, dto.TotalEnergyKwh, dto.UnitPrice);
        
        if (success)
        {
            // 🔔 BROADCAST REAL-TIME UPDATE
            await _notificationService.NotifyChargingCompleted(
                booking.BookingId,
                booking.StationId,
                booking.SlotId,
                booking.ConnectorCode
            );
        }
        
        return Ok(new { message = "Charging completed successfully" });
    }
    catch (Exception ex) { /* ... */ }
}
```

#### InvoicesController.cs - ProcessPayment

**Location:** After payment processing

```csharp
[HttpPost("{id}/process-payment")]
public async Task<IActionResult> ProcessPayment(int id, [FromBody] ProcessPaymentDto dto)
{
    try
    {
        // ... existing payment processing ...
        
        await _invoiceService.ProcessPaymentAsync(id, dto);
        
        var invoice = await _invoiceService.GetInvoiceByIdAsync(id);
        var booking = await _bookingService.GetBookingByIdAsync(invoice.BookingId);
        
        // 🔔 BROADCAST REAL-TIME UPDATE
        await _notificationService.NotifyPaymentCompleted(
            booking.BookingId,
            booking.StationId,
            booking.SlotId,
            booking.ConnectorCode
        );
        
        return Ok(new { message = "Payment processed successfully" });
    }
    catch (Exception ex) { /* ... */ }
}
```

### Step 4: Frontend - SignalR Connection

#### Create SignalR Service

**File:** `src/services/signalrService.js`

```javascript
import * as signalR from "@microsoft/signalr";

class SignalRService {
  constructor() {
    this.connection = null;
    this.listeners = new Map();
  }

  async connect() {
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      console.log("✅ Already connected to SignalR");
      return;
    }

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl("http://localhost:5000/hubs/station-monitoring", {
        withCredentials: false,
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Information)
      .build();

    // Setup event handlers
    this.connection.on("ReceiveChargingUpdate", (data) => {
      console.log("🔔 Charging update received:", data);
      this.notifyListeners("chargingUpdate", data);
    });

    this.connection.on("ReceiveStationUpdate", (data) => {
      console.log("📡 Station update received:", data);
      this.notifyListeners("stationUpdate", data);
    });

    this.connection.on("ReceiveSlotStatus", (data) => {
      console.log("🔄 Slot status update:", data);
      this.notifyListeners("slotUpdate", data);
    });

    this.connection.onreconnecting(() => {
      console.log("🔄 Reconnecting to SignalR...");
    });

    this.connection.onreconnected(() => {
      console.log("✅ Reconnected to SignalR");
    });

    this.connection.onclose(() => {
      console.log("❌ SignalR connection closed");
    });

    try {
      await this.connection.start();
      console.log("✅ SignalR connected successfully");
    } catch (err) {
      console.error("❌ SignalR connection error:", err);
      setTimeout(() => this.connect(), 5000); // Retry after 5s
    }
  }

  subscribe(eventType, callback) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType).push(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(eventType);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    };
  }

  notifyListeners(eventType, data) {
    const callbacks = this.listeners.get(eventType) || [];
    callbacks.forEach((callback) => callback(data));
  }

  async disconnect() {
    if (this.connection) {
      await this.connection.stop();
      this.listeners.clear();
      console.log("✅ SignalR disconnected");
    }
  }

  async subscribeToStation(stationId) {
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      await this.connection.invoke("SubscribeToStation", stationId);
      console.log(`📡 Subscribed to Station ${stationId}`);
    }
  }
}

export default new SignalRService();
```

#### Install SignalR Client

```bash
npm install @microsoft/signalr
```

### Step 5: Frontend - Staff Dashboard Integration

**File:** `src/pages/staff/Dashboard.jsx`

```javascript
import { useEffect } from 'react';
import signalRService from '../../services/signalrService';
import { useStaffStore } from '../../store/staffStore';

const Dashboard = () => {
  const { dashboardData, loadDashboard } = useStaffStore();

  useEffect(() => {
    // Connect to SignalR
    signalRService.connect();

    // Subscribe to station updates
    if (dashboardData?.station?.stationId) {
      signalRService.subscribeToStation(dashboardData.station.stationId);
    }

    // Listen for charging updates
    const unsubscribeCharging = signalRService.subscribe(
      'chargingUpdate',
      (data) => {
        console.log('🔔 Dashboard received charging update:', data);
        
        // Reload dashboard data
        loadDashboard();
      }
    );

    const unsubscribeStation = signalRService.subscribe(
      'stationUpdate',
      (data) => {
        console.log('📡 Dashboard received station update:', data);
        loadDashboard();
      }
    );

    // Cleanup
    return () => {
      unsubscribeCharging();
      unsubscribeStation();
    };
  }, [dashboardData?.station?.stationId]);

  // ... rest of component
};
```

### Step 6: Frontend - Customer Charging Page Integration

**File:** `src/pages/customer/ChargingFlow.jsx`

```javascript
import { useEffect } from 'react';
import signalRService from '../../services/signalrService';

const ChargingFlow = () => {
  const { currentBooking, refreshBooking } = useBookingStore();

  useEffect(() => {
    signalRService.connect();

    const unsubscribe = signalRService.subscribe('chargingUpdate', (data) => {
      // Check if this update is for current user's booking
      if (data.BookingId === currentBooking?.bookingId) {
        console.log('🔔 Your charging session updated:', data);
        
        // Update UI based on event type
        if (data.EventType === 'PaymentCompleted') {
          // Show success message
          // Redirect to completed page
        }
        
        refreshBooking();
      }
    });

    return () => unsubscribe();
  }, [currentBooking?.bookingId]);

  // ... rest of component
};
```

### Step 7: Backend - Register Service

**File:** `SkaEV.API/Program.cs`

**Add after line 134:**

```csharp
builder.Services.AddScoped<StationAnalyticsService>();

// Real-time SignalR Notification Service
builder.Services.AddSingleton<IStationNotificationService, StationNotificationService>();

// Admin Management Services
```

**Note:** Use `AddSingleton` vì SignalR HubContext nên được share across requests.

### Step 8: Backend - Inject into Controllers

**File:** `SkaEV.API/Controllers/BookingsController.cs`

```csharp
private readonly IBookingService _bookingService;
private readonly IStationNotificationService _notificationService; // ADD THIS
private readonly ILogger<BookingsController> _logger;

public BookingsController(
    IBookingService bookingService,
    IStationNotificationService notificationService, // ADD THIS
    ILogger<BookingsController> logger)
{
    _bookingService = bookingService;
    _notificationService = notificationService; // ADD THIS
    _logger = logger;
}
```

**File:** `SkaEV.API/Controllers/InvoicesController.cs`

```csharp
private readonly IInvoiceService _invoiceService;
private readonly IStationNotificationService _notificationService; // ADD THIS
private readonly ILogger<InvoicesController> _logger;

public InvoicesController(
    IInvoiceService invoiceService,
    IStationNotificationService notificationService, // ADD THIS
    ILogger<InvoicesController> logger)
{
    _invoiceService = invoiceService;
    _notificationService = notificationService; // ADD THIS
    _logger = logger;
}
```

## 🧪 Testing Flow

### Test 1: Customer Start Charging → Staff See Update

1. **Customer Side:**
   - Login as customer
   - Create booking
   - Click "Start Charging"
   - Console should show: `PUT /api/bookings/19/start`

2. **Backend:**
   - Execute `sp_start_charging`
   - Send SignalR: `ReceiveChargingUpdate { EventType: "ChargingStarted" }`

3. **Staff Side:**
   - Console should show: `🔔 Dashboard received charging update`
   - Dashboard refreshes automatically
   - Connector shows "Occupied" with customer name

### Test 2: Customer Complete Charging → Staff See Update

1. **Customer Side:**
   - Click "Stop Charging"
   - Status → "Completed, awaiting payment"

2. **Backend:**
   - Send SignalR: `ReceiveChargingUpdate { EventType: "ChargingCompleted" }`

3. **Staff Side:**
   - Dashboard updates
   - Session shows in "Pending Payments" list

### Test 3: Staff Process Payment → Customer See Update

1. **Staff Side:**
   - Open "Charging Sessions"
   - Click "Process Payment" for completed session
   - Enter payment details
   - Submit

2. **Backend:**
   - Process payment
   - Update slot to "available"
   - Send SignalR: `ReceiveChargingUpdate { EventType: "PaymentCompleted" }`

3. **Customer Side:**
   - Booking status → "Paid"
   - Show success message
   - Redirect to history

## 📊 Event Flow Diagram

```
Customer Action          Backend               SignalR              Staff UI
─────────────────────────────────────────────────────────────────────────────
Start Charging    →  sp_start_charging   →  ChargingStarted  →  Refresh Dashboard
                     current_booking_id       { booking, slot }      Show "Occupied"
                     
Complete Charging →  sp_complete_charging → ChargingCompleted → Show "Awaiting Payment"
                     status='completed'       { booking }           activeSessions--
                     
Process Payment   →  InvoiceService      →  PaymentCompleted  →  Show "Available"
                     Payment created         { booking, slot }     currentBookingId=NULL


Staff Action            Backend               SignalR              Customer UI
─────────────────────────────────────────────────────────────────────────────
Process Payment   →  InvoiceService      →  PaymentCompleted  →  Show "Paid"
                     status='paid'           { booking }           Redirect to History
```

## 🔍 Debugging Tips

### Backend Logs
```
🔌 Broadcasting: Charging started - Booking 19, Connector POST-01-A1
✅ Broadcasting: Charging completed - Booking 19, Connector POST-01-A1
💳 Broadcasting: Payment completed - Booking 19, Connector POST-01-A1 now available
```

### Frontend Console (Staff)
```javascript
✅ SignalR connected successfully
📡 Subscribed to Station 1
🔔 Dashboard received charging update: { EventType: "ChargingStarted", BookingId: 19, ... }
📊 Dashboard API Response: { activeSessions: 1 }
```

### Frontend Console (Customer)
```javascript
✅ SignalR connected successfully
🔔 Your charging session updated: { EventType: "PaymentCompleted" }
✅ Payment completed, redirecting...
```

## ⚠️ Current Issues

1. **Backend is running** (Process 17636)
   - Cannot build while running
   - Need to stop: Find process and kill OR use Ctrl+C in terminal

2. **Next Steps:**
   - Stop backend API
   - Rebuild with new changes
   - Restart backend
   - Test real-time updates

## 📝 Files Modified

### Backend
- ✅ `Program.cs` - Enabled SignalR Hub
- ✅ `StationNotificationService.cs` - Created
- ⏳ `BookingsController.cs` - Need to inject notifications
- ⏳ `InvoicesController.cs` - Need to inject notifications

### Frontend
- ⏳ `signalrService.js` - Need to create
- ⏳ `Dashboard.jsx` - Need to integrate SignalR
- ⏳ `ChargingSessions.jsx` - Need to integrate SignalR
- ⏳ `Monitoring.jsx` - Need to integrate SignalR
- ⏳ `ChargingFlow.jsx` - Need to integrate SignalR (customer side)

---

**Status:** Backend changes ready, need to stop running process and rebuild  
**Next:** Frontend integration with SignalR client
