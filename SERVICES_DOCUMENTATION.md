# 📚 Tài Liệu Chi Tiết Về Services - SkaEV Project

## 📋 Mục Lục
1. [Tổng Quan](#tổng-quan)
2. [Backend Services (C#)](#backend-services-c)
3. [Frontend Services (JavaScript)](#frontend-services-javascript)
4. [Kiến Trúc Service Layer](#kiến-trúc-service-layer)
5. [Luồng Dữ Liệu](#luồng-dữ-liệu)

---

## 🎯 Tổng Quan

Dự án SkaEV sử dụng kiến trúc **Service-Oriented Architecture (SOA)** với 2 lớp services:
- **Backend Services (C#)**: Xử lý business logic, database operations, và external API integrations
- **Frontend Services (JavaScript)**: Giao tiếp với backend API, quản lý state, và xử lý UI logic

---

## 🔧 Backend Services (C#)

### 📍 Vị Trí: `SkaEV.API/Application/Services/`

### 1. **AuthService.cs** - Xác Thực & Đăng Nhập

**Chức năng chính:**
- Xử lý đăng nhập/đăng ký người dùng
- Tạo và quản lý JWT tokens
- Xác thực mật khẩu (BCrypt)
- Migration mật khẩu legacy sang BCrypt

**Các phương thức:**
```csharp
- LoginAsync(LoginRequestDto) → LoginResponseDto
- RegisterAsync(RegisterRequestDto) → RegisterResponseDto  
- GetUserByIdAsync(int userId) → User
- GenerateJwtToken(User) → string (private)
```

**Đặc điểm:**
- ✅ Hỗ trợ migration mật khẩu cũ (plaintext → BCrypt)
- ✅ JWT token với expiration 24 giờ
- ✅ Claims: UserId, Email, FullName, Role
- ✅ Logging đầy đủ cho security audit

**Ví dụ sử dụng:**
```csharp
var authService = new AuthService(context, configuration, logger);
var loginResult = await authService.LoginAsync(new LoginRequestDto 
{ 
    Email = "user@example.com", 
    Password = "password123" 
});
```

---

### 2. **BookingService.cs** - Quản Lý Đặt Chỗ

**Chức năng chính:**
- Tạo booking mới (scheduled/immediate)
- Quản lý phiên sạc (start/complete/cancel)
- Xử lý quét QR code để đặt chỗ nhanh
- Validation thời gian đặt (chỉ trong ngày, tối thiểu 30 phút)

**Các phương thức:**
```csharp
- CreateBookingAsync(CreateBookingDto) → int (bookingId)
- GetBookingByIdAsync(int) → BookingDto
- GetUserBookingsAsync(int userId) → List<BookingDto>
- CancelBookingAsync(int, string?) → bool
- StartChargingAsync(int) → bool
- CompleteChargingAsync(int, decimal, decimal, decimal) → bool
- ScanQRCodeAsync(ScanQRCodeDto) → int (bookingId)
```

**Đặc điểm:**
- ✅ Sử dụng stored procedures (`sp_create_booking`, `sp_start_charging`, etc.)
- ✅ Validation timezone Việt Nam (UTC+7)
- ✅ QR code format: `SLOT-{slotId}-STATION-{stationId}`
- ✅ Auto-update slot status khi booking

**Business Rules:**
- Chỉ cho phép đặt trong ngày hôm nay
- Thời gian đặt phải cách hiện tại ít nhất 30 phút
- Slot phải available trước khi booking

---

### 3. **StationService.cs** - Quản Lý Trạm Sạc

**Chức năng chính:**
- CRUD operations cho charging stations
- Tìm kiếm trạm theo vị trí (GPS)
- Quản lý posts và slots
- Tính toán availability

**Các phương thức:**
```csharp
- GetAllStationsAsync(string? city, string? status) → List<StationDto>
- SearchStationsByLocationAsync(SearchStationsRequestDto) → List<StationDto>
- GetStationByIdAsync(int) → StationDto
- CreateStationAsync(CreateStationDto) → StationDto
- GetAvailableSlotsAsync(int stationId) → List<ChargingSlotDto>
- GetAvailablePostsAsync(int stationId) → List<PostDto>
- UpdateStationAsync(int, UpdateStationDto) → bool
- DeleteStationAsync(int) → bool (soft delete)
```

**Đặc điểm:**
- ✅ GPS-based search với radius filtering
- ✅ Parse amenities từ JSON hoặc comma-separated
- ✅ Status helpers: `IsSlotAvailable`, `IsSlotOccupied`, etc.
- ✅ Nested structure: Station → Post → Slot

**Status Values:**
- `available`: Slot trống, có thể đặt
- `occupied/charging/in_use`: Đang sử dụng
- `maintenance`: Bảo trì
- `reserved`: Đã đặt trước

---

### 4. **InvoiceService.cs** - Quản Lý Hóa Đơn & Thanh Toán

**Chức năng chính:**
- Tạo và quản lý invoices
- Xử lý thanh toán qua payment processor
- Generate PDF invoices
- Lịch sử thanh toán

**Các phương thức:**
```csharp
- GetUserInvoicesAsync(int userId) → IEnumerable<InvoiceDto>
- GetInvoiceByIdAsync(int) → InvoiceDto
- GetInvoiceByBookingIdAsync(int) → InvoiceDto
- ProcessPaymentAsync(int, ProcessPaymentDto, int) → InvoiceDto
- UpdatePaymentStatusAsync(int, UpdatePaymentStatusDto) → InvoiceDto
- GetPaymentHistoryAsync(int invoiceId) → IEnumerable<PaymentHistoryDto>
- GenerateInvoicePdfAsync(int) → byte[] (PDF)
```

**Đặc điểm:**
- ✅ Tích hợp với `IPaymentProcessor` (strategy pattern)
- ✅ Validation: amount matching, payment method ownership
- ✅ Payment status: `pending`, `paid`, `failed`, `refunded`
- ✅ PDF generation (text-based, có thể nâng cấp)

**Payment Flow:**
1. Invoice được tạo khi charging session complete
2. User chọn payment method
3. `ProcessPaymentAsync` gọi payment processor
4. Update invoice status dựa trên kết quả

---

### 5. **MapsService.cs** - Bản Đồ & Chỉ Đường

**Chức năng chính:**
- Lấy chỉ đường từ Google Maps API
- Fallback sang OSRM (free routing service)
- Tính toán route polyline
- Navigation steps

**Các phương thức:**
```csharp
- GetDrivingDirectionsAsync(DirectionsRequestDto, CancellationToken) 
  → DirectionsResponseDto
```

**Đặc điểm:**
- ✅ Dual provider: Google Maps (primary) + OSRM (fallback)
- ✅ Polyline encoding/decoding
- ✅ Distance & duration calculation
- ✅ Detailed navigation steps

**Configuration:**
```json
"GoogleMaps": {
  "DirectionsApiKey": "YOUR_API_KEY",
  "BaseUrl": "https://maps.googleapis.com/maps/api"
}
```

**Response Structure:**
```csharp
{
  Success: bool,
  Route: {
    Polyline: List<Point> (lat/lng coordinates),
    Leg: {
      DistanceMeters: int,
      DurationSeconds: int,
      Steps: List<Step>
    }
  },
  Error: string?
}
```

---

### 6. **QRCodeService.cs** - Quản Lý Mã QR

**Chức năng chính:**
- Generate QR codes cho instant booking
- Validate QR codes
- Track QR usage (scan count, expiry)
- Link QR với slot/station

**Các phương thức:**
```csharp
- GenerateQRCodeAsync(int userId, GenerateQRCodeDto) → QRCodeDto
- GetQRCodeByIdAsync(int) → QRCodeDto
- ValidateQRCodeAsync(string qrData) → QRCodeDto
- UseQRCodeAsync(int qrId, UseQRCodeDto) → bool
- GetUserQRCodesAsync(int userId) → List<QRCodeDto>
```

**QR Data Format:**
```
SLOT-{slotId}-STATION-{stationId}
```

**Đặc điểm:**
- ✅ Unique QR data generation (hash-based)
- ✅ Expiry time management
- ✅ Scan count tracking
- ✅ Auto-assign available slot

---

### 7. **VehicleService.cs** - Quản Lý Phương Tiện

**Chức năng chính:**
- CRUD operations cho vehicles
- Validation VIN và license plate
- Connector type management
- Primary vehicle selection

**Các phương thức:**
```csharp
- GetUserVehiclesAsync(int userId) → IEnumerable<VehicleDto>
- GetVehicleByIdAsync(int) → VehicleDto
- CreateVehicleAsync(int userId, CreateVehicleDto) → VehicleDto
- UpdateVehicleAsync(int, UpdateVehicleDto) → VehicleDto
- DeleteVehicleAsync(int) → bool
- SetPrimaryVehicleAsync(int userId, int vehicleId) → bool
```

**Validation Rules:**
- VIN: 17 ký tự, alphanumeric
- License Plate: Format chuẩn Việt Nam
- Connector Types: JSON array hoặc single value
- Vehicle Type: Auto-detect từ make/model

**Normalization:**
- VIN: Uppercase, remove spaces
- License Plate: Uppercase, format standardization

---

### 8. **Payment Processors** - Xử Lý Thanh Toán

**Location:** `SkaEV.API/Application/Services/Payments/`

#### **IPaymentProcessor.cs** (Interface)
```csharp
Task<PaymentAttemptResult> ProcessAsync(
    Invoice invoice, 
    PaymentMethod paymentMethod, 
    decimal amount
)
```

#### **SimulatedPaymentProcessor.cs**
- Mock payment processor cho development
- Always returns success
- Generate fake transaction IDs

#### **VNPayService.cs**
- Tích hợp VNPay payment gateway
- Create payment URLs
- Handle callbacks
- Transaction verification

**Payment Status:**
- `pending`: Đang chờ xử lý
- `completed`: Thanh toán thành công
- `failed`: Thanh toán thất bại

---

### 9. **Simulation Services** - Mô Phỏng Hệ Thống

**Location:** `SkaEV.API/Application/Services/Simulation/`

#### **ChargingSimulationService.cs**
- Mô phỏng quá trình sạc
- SOC (State of Charge) updates
- Power delivery simulation
- Energy consumption tracking

#### **SystemEventsSimulationService.cs**
- Generate system events
- Maintenance scheduling
- Incident simulation
- Performance metrics

---

### 10. **Các Services Khác**

#### **UserProfileService.cs**
- Quản lý user profiles
- Statistics & analytics
- Profile updates

#### **NotificationService.cs**
- Push notifications
- In-app notifications
- Email notifications

#### **ReviewService.cs**
- Station reviews
- Rating management
- Review moderation

#### **IncidentService.cs**
- Issue tracking
- Incident management
- Staff assignment

#### **AdminUserService.cs** & **AdminStationManagementService.cs**
- Admin dashboard operations
- User management
- Station management
- Advanced analytics

#### **ReportService.cs** (68KB - Service lớn nhất)
- Revenue reports
- Usage statistics
- Performance metrics
- Export functionality

---

## 🌐 Frontend Services (JavaScript)

### 📍 Vị Trí: `src/services/`

### 1. **api.js** - API Client Chính

**Chức năng:**
- Axios instance với interceptors
- Auto token injection
- Auto token refresh
- Error handling

**Cấu trúc:**
```javascript
// Base configuration
const API_BASE_URL = "http://localhost:5000/api"
const axiosInstance = axios.create({ baseURL, timeout: 10000 })

// Request interceptor: Add JWT token
axiosInstance.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("token") || localStorage.getItem("token")
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Response interceptor: Handle errors & token refresh
axiosInstance.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    if (error.response?.status === 401) {
      // Try refresh token
      // Retry original request
    }
  }
)
```

**Exported APIs:**
```javascript
export const authAPI = { login, register, logout, getProfile, ... }
export const stationsAPI = { getAll, getById, getNearby, ... }
export const bookingsAPI = { getAll, create, cancel, start, complete, ... }
export const invoicesAPI = { getMyInvoices, getById, download, ... }
export const vehiclesAPI = { getAll, create, update, delete, ... }
export const paymentMethodsAPI = { getMine, create, setDefault, ... }
export const reviewsAPI = { getStationReviews, create, update, ... }
export const incidentsAPI = { getAll, create, update, assign, ... }
export const qrCodesAPI = { generate, validate, use, ... }
```

**Đặc điểm:**
- ✅ Centralized API configuration
- ✅ Auto token management
- ✅ Consistent error handling
- ✅ Type-safe API calls

---

### 2. **invoiceService.js** - Xử Lý Hóa Đơn Frontend

**Chức năng:**
- Generate invoice numbers
- Calculate taxes
- Format invoice HTML
- Export to CSV/PDF

**Các phương thức:**
```javascript
- generateInvoiceNumber() → string
- calculateTax(amount, taxRate) → { subtotal, tax, total }
- generateChargingInvoice(session, pricing) → Invoice
- generateSubscriptionInvoice(subscription, customer) → Invoice
- formatInvoiceHTML(invoice) → string (HTML)
- generateInvoicePDF(invoiceData) → void (download)
- exportInvoicesToExcel(invoices) → void (download CSV)
```

**Invoice Structure:**
```javascript
{
  invoiceNumber: "INV-2025-01-001",
  date: "2025-01-15",
  session: { /* charging session details */ },
  pricing: {
    energyCost: 50000,
    parkingCost: 10000,
    subtotal: 60000,
    tax: 6000,
    total: 66000
  },
  customer: { name, email, phone },
  status: "completed"
}
```

**Đặc điểm:**
- ✅ Client-side invoice generation
- ✅ Beautiful HTML templates
- ✅ Print-friendly CSS
- ✅ CSV export functionality

---

### 3. **directionsService.js** - Chỉ Đường

**Chức năng:**
- Gọi backend Maps API
- Fallback sang mock data nếu API fail
- Generate realistic mock routes
- Navigation steps

**Các phương thức:**
```javascript
- getDrivingDirections({ origin, destination, mode }) 
  → Promise<DirectionsResponse>
```

**Mock Route Generation:**
- Curved polyline paths
- Realistic step distances
- Vietnamese navigation instructions
- Distance/duration calculation (Haversine)

**Response Format:**
```javascript
{
  success: true,
  route: {
    polyline: [{ lat, lng }, ...],
    leg: {
      distanceMeters: 5000,
      durationSeconds: 600,
      steps: [
        { instructionText: "Rẽ phải", distanceText: "500 m", ... }
      ]
    }
  }
}
```

---

### 4. **notificationService.js** - Thông Báo

**Chức năng:**
- Web Push Notifications
- In-app notification center
- Daily promotion limits (max 2/day)
- Notification persistence

**Các phương thức:**
```javascript
- requestPermission() → Promise<boolean>
- showPushNotification(title, options) → Notification
- addNotification(notification) → void
- markAsRead(id) → void
- clearAll() → void
- getUnreadCount() → number
```

**Notification Types:**
- `booking_confirmed`: Xác nhận đặt chỗ
- `charging_started`: Bắt đầu sạc
- `charging_completed`: Hoàn thành sạc
- `payment_success`: Thanh toán thành công
- `promotion`: Khuyến mãi

**Đặc điểm:**
- ✅ Browser Notification API
- ✅ LocalStorage persistence
- ✅ Unread count tracking
- ✅ Promotion rate limiting

---

### 5. **Các Services Khác**

#### **stationDataService.js**
- Station data caching
- Availability updates
- Real-time sync

#### **stationAnalyticsAPI.js**
- Analytics endpoints
- Performance metrics
- Usage statistics

#### **adminStationAPI.js**
- Admin station operations
- CRUD operations
- Bulk operations

#### **staffService.js**
- Staff dashboard data
- Station assignments
- Issue management

#### **signalRService.js**
- Real-time updates
- WebSocket connection
- Live notifications

#### **vnpayService.js**
- VNPay integration (deprecated)
- Payment URL generation
- Callback handling

---

## 🏗️ Kiến Trúc Service Layer

### **Backend Architecture**

```
Controller Layer
    ↓
Service Layer (Business Logic)
    ↓
Repository/Entity Framework
    ↓
Database (SQL Server)
```

**Dependency Injection:**
```csharp
// Program.cs
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IBookingService, BookingService>();
builder.Services.AddScoped<IStationService, StationService>();
// ...
```

### **Frontend Architecture**

```
React Components
    ↓
Zustand Stores (State Management)
    ↓
Service Layer (API Calls)
    ↓
Axios Instance
    ↓
Backend API
```

**Service Usage Pattern:**
```javascript
// In React component
import { bookingsAPI } from '@/services/api'

const MyComponent = () => {
  const [bookings, setBookings] = useState([])
  
  useEffect(() => {
    bookingsAPI.getUserBookings()
      .then(setBookings)
      .catch(console.error)
  }, [])
  
  return <div>...</div>
}
```

---

## 🔄 Luồng Dữ Liệu

### **1. User Login Flow**

```
Frontend (Login.jsx)
    ↓
authAPI.login(credentials)
    ↓
Axios POST /api/auth/login
    ↓
AuthController.Login()
    ↓
AuthService.LoginAsync()
    ↓
Database Query (Users table)
    ↓
Password Verification (BCrypt)
    ↓
Generate JWT Token
    ↓
Return LoginResponseDto
    ↓
Frontend stores token
    ↓
Redirect to Dashboard
```

### **2. Booking Creation Flow**

```
Frontend (BookingModal.jsx)
    ↓
User selects station/slot/time
    ↓
bookingsAPI.create(bookingData)
    ↓
BookingsController.Create()
    ↓
BookingService.CreateBookingAsync()
    ↓
Validation (time, slot availability)
    ↓
Stored Procedure: sp_create_booking
    ↓
Database: Insert Booking, Update Slot
    ↓
Return BookingId
    ↓
Frontend shows confirmation
```

### **3. Charging Session Flow**

```
User arrives at station
    ↓
Scan QR Code / Start button
    ↓
bookingsAPI.start(bookingId)
    ↓
BookingsController.Start()
    ↓
BookingService.StartChargingAsync()
    ↓
Stored Procedure: sp_start_charging
    ↓
Update Booking status = "charging"
    ↓
Real-time SOC updates (SignalR)
    ↓
User stops charging
    ↓
bookingsAPI.complete(bookingId, data)
    ↓
BookingService.CompleteChargingAsync()
    ↓
Calculate energy, create invoice
    ↓
Return invoice details
```

### **4. Payment Flow**

```
Invoice created after charging
    ↓
User selects payment method
    ↓
invoicesAPI.processPayment(invoiceId, data)
    ↓
InvoicesController.ProcessPayment()
    ↓
InvoiceService.ProcessPaymentAsync()
    ↓
Validate payment method
    ↓
IPaymentProcessor.ProcessAsync()
    ↓
VNPayService / SimulatedPaymentProcessor
    ↓
Update invoice status
    ↓
Return payment result
```

---

## 📊 Service Dependencies

### **Backend Service Dependencies**

```
AuthService
  ├── SkaEVDbContext
  ├── IConfiguration
  └── ILogger<AuthService>

BookingService
  ├── SkaEVDbContext
  └── (uses stored procedures)

InvoiceService
  ├── SkaEVDbContext
  ├── ILogger<InvoiceService>
  └── IPaymentProcessor

MapsService
  ├── HttpClient
  ├── IOptions<GoogleMapsOptions>
  └── ILogger<MapsService>
```

### **Frontend Service Dependencies**

```
api.js
  ├── axios
  └── axiosConfig.js

invoiceService.js
  └── utils/helpers.js (formatCurrency)

directionsService.js
  └── axiosConfig.js

notificationService.js
  └── (Browser APIs: Notification, localStorage)
```

---

## 🔐 Security Considerations

### **Backend:**
- ✅ Password hashing (BCrypt)
- ✅ JWT token authentication
- ✅ SQL injection prevention (parameterized queries)
- ✅ Input validation
- ✅ Role-based access control

### **Frontend:**
- ✅ Token storage (sessionStorage/localStorage)
- ✅ Auto token refresh
- ✅ HTTPS only in production
- ✅ XSS prevention (React auto-escaping)

---

## 🧪 Testing Services

### **Backend Testing:**
```csharp
// Unit tests for services
[Fact]
public async Task LoginAsync_ValidCredentials_ReturnsToken()
{
    // Arrange
    var service = new AuthService(context, config, logger);
    
    // Act
    var result = await service.LoginAsync(validRequest);
    
    // Assert
    Assert.NotNull(result);
    Assert.NotNull(result.Token);
}
```

### **Frontend Testing:**
```javascript
// Mock API calls
vi.mock('@/services/api', () => ({
  bookingsAPI: {
    getUserBookings: vi.fn(() => Promise.resolve(mockBookings))
  }
}))
```

---

## 📝 Best Practices

### **Backend:**
1. ✅ Use async/await for all database operations
2. ✅ Log all important operations
3. ✅ Use DTOs for data transfer
4. ✅ Validate input data
5. ✅ Use dependency injection
6. ✅ Handle errors gracefully

### **Frontend:**
1. ✅ Centralize API calls in service layer
2. ✅ Use interceptors for common logic
3. ✅ Handle errors consistently
4. ✅ Cache data when appropriate
5. ✅ Use TypeScript for type safety (if applicable)

---

## 🚀 Performance Optimization

### **Backend:**
- Use stored procedures for complex queries
- Implement caching for frequently accessed data
- Use pagination for large datasets
- Optimize database queries (Include, Select projections)

### **Frontend:**
- Debounce API calls
- Cache responses
- Lazy load services
- Use React Query for data fetching (if applicable)

---

## 📚 Tài Liệu Tham Khảo

- [ASP.NET Core Documentation](https://docs.microsoft.com/aspnet/core)
- [Entity Framework Core](https://docs.microsoft.com/ef/core)
- [Axios Documentation](https://axios-http.com)
- [JWT Authentication](https://jwt.io)

---

**Last Updated:** January 2025
**Maintained by:** SkaEV Development Team

