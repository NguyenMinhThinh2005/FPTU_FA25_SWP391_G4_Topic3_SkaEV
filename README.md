# SkaEV - Electric Vehicle Charging Station Management System

**Hệ thống Quản lý Trạm Sạc Xe Điện**

[![.NET](https://img.shields.io/badge/.NET-8.0-purple)](https://dotnet.microsoft.com/)
[![React](https://img.shields.io/badge/React-19-blue)](https://react.dev/)
[![SQL Server](https://img.shields.io/badge/SQL%20Server-2019+-red)](https://www.microsoft.com/sql-server)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

---

## 🚀 Quick Start - Chạy Local Nhanh

### Cách 1: Dùng Script Tự Động (Khuyến nghị)

```powershell
# Clone repository
git clone https://github.com/NguyenMinhThinh2005/FPTU_FA25_SWP391_G4_Topic3_SkaEV.git
cd FPTU_FA25_SWP391_G4_Topic3_SkaEV

# Setup database (chỉ lần đầu)
cd database
sqlcmd -S localhost -E -i DEPLOY_COMPLETE.sql
cd ..

# Start tất cả services
.\start-all.ps1
```

**Script sẽ tự động:**
- ✅ Kiểm tra SQL Server, Database, .NET, Node.js
- ✅ Start Backend API (https://localhost:5001)
- ✅ Start Frontend Dev Server (http://localhost:5173)

### Cách 2: Manual Start

**Terminal 1 - Backend:**
```powershell
cd SkaEV.API
dotnet run
```

**Terminal 2 - Frontend:**
```powershell
npm install
npm run dev
```

**Mở browser:** http://localhost:5173

---

## � Hướng Dẫn Setup Chi Tiết

### 🎯 Dành cho Thành Viên Mới
- **[QUICK_START.md](./QUICK_START.md)** - Setup trong 5 phút ⚡
- **[SETUP_FOR_TEAM.md](./SETUP_FOR_TEAM.md)** - Hướng dẫn chi tiết từng bước 📖
- **[CONFIG_CHECKLIST.md](./CONFIG_CHECKLIST.md)** - Checklist trước khi push/pull ✅

### 🔑 Thông Tin Quan Trọng
- **[ACCOUNT_PASSWORDS.md](./ACCOUNT_PASSWORDS.md)** - Tài khoản test & đăng nhập 🔐
- **[SETUP_DATABASE.md](./SETUP_DATABASE.md)** - Setup database chi tiết 💾

### ⚙️ File Cấu Hình Mẫu
- `.env.example` - Frontend configuration template
- `SkaEV.API/appsettings.template.json` - Backend configuration template

> **⚠️ Lưu ý:** Các file config thật (`.env`, `appsettings.json`) KHÔNG được commit lên Git!

---

## �📋 Yêu Cầu Hệ Thống

| Phần mềm | Version | Download |
|----------|---------|----------|
| .NET SDK | 8.0+ | [Download](https://dotnet.microsoft.com/download) |
| Node.js | 18+ | [Download](https://nodejs.org/) |
| SQL Server | 2019+ | [Download](https://www.microsoft.com/sql-server) |

**Kiểm tra nhanh:**
```powershell
dotnet --version  # 8.0.x
node --version    # v18.x.x
npm --version     # 9.x.x
```

---

## 🏗️ Kiến Trúc Hệ Thống

```
┌─────────────────┐      HTTPS/REST API      ┌─────────────────┐
│   Frontend      │ ←─────────────────────→  │   Backend API   │
│  React + Vite   │   JWT Authentication     │  ASP.NET Core   │
│  Zustand Store  │   Axios HTTP Client      │  Entity FW Core │
└─────────────────┘                           └─────────────────┘
        ↓                                              ↓
   localStorage                                       ↓
   (JWT Tokens)                              ┌─────────────────┐
                                             │   SQL Server    │
                                             │   SkaEV_DB      │
                                             │   16 Tables     │
                                             │   15 Stored Procs│
                                             └─────────────────┘
```

---

## 📁 Cấu Trúc Project

```
FPTU_FA25_SWP391_G4_Topic3_SkaEV/
├── 📂 SkaEV.API/                    # Backend ASP.NET Core 8
│   ├── Controllers/                 # API Controllers (Auth, Stations, Bookings)
│   ├── Application/                 # Services & DTOs
│   │   ├── Services/                # Business Logic
│   │   └── DTOs/                    # Data Transfer Objects
│   ├── Domain/Entities/             # 16 Entity Classes
│   ├── Infrastructure/              # DbContext, Repositories
│   │   └── Data/SkaEVDbContext.cs
│   ├── Program.cs                   # App Configuration
│   └── appsettings.json             # Configuration (DB, JWT, CORS)
│
├── 📂 src/                          # Frontend React 19
│   ├── components/                  # Reusable Components
│   ├── pages/                       # Page Components
│   │   ├── auth/                    # Login, Register
│   │   ├── customer/                # Customer Dashboard, Booking
│   │   ├── staff/                   # Staff Dashboard
│   │   └── admin/                   # Admin Dashboard
│   ├── services/                    # API Service Layer
│   │   └── api.js                   # Axios HTTP Client
│   ├── store/                       # Zustand State Management
│   │   ├── authStore.js             # Authentication Store
│   │   ├── bookingStore.js          # Booking Management
│   │   └── stationStore.js          # Station Data
│   └── App.jsx                      # Main App Component
│
├── 📂 database/                     # Database Scripts
│   ├── DEPLOY_COMPLETE.sql          # Complete DB Setup
│   ├── 04_STORED_PROCEDURES.sql     # 15 Stored Procedures
│   └── VERIFY_MSSQL.sql             # Verification Script
│
├── 📂 public/                       # Static Assets
├── package.json                     # Frontend Dependencies
├── vite.config.js                   # Vite Configuration
├── start-all.ps1                    # Auto-start Script
├── QUICK_START.md                   # Quick Start Guide
├── LOCAL_SETUP_GUIDE.md             # Detailed Setup Guide
└── README.md                        # This file
```

---

## 🔑 Key Features

### ✅ Đã Hoàn Thành (Production Ready)

#### 🔐 **Authentication & Authorization**
- JWT Token-based authentication
- Role-based access control (Customer, Staff, Admin)
- Auto token refresh mechanism
- Secure password hashing (BCrypt)

#### 📍 **Station Management**
- Real-time station availability
- GPS-based nearby station search
- Charging post & slot management
- Station analytics & reporting

#### 📅 **Booking System**
- QR code booking & scanning
- Scheduled vs immediate charging
- Real-time SOC (State of Charge) tracking
- Booking history & invoices

#### ⚡ **Charging Session**
- Start/Stop charging via QR scan
- Real-time SOC updates
- Power delivery monitoring (kW, V, A)
- Energy consumption tracking
- Auto-complete on target SOC

#### 💰 **Payment & Pricing**
- Dynamic pricing (AC/DC rates)
- Invoice generation
- Payment method management
- Transaction history

#### 📊 **Admin Dashboard**
- System analytics & reports
- User management
- Station management
- Revenue tracking

---

## 🔗 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login (returns JWT)
- `GET /api/auth/profile` - Get user profile (requires auth)
- `POST /api/auth/refresh` - Refresh JWT token

### Stations
- `GET /api/stations` - Get all stations
- `GET /api/stations/{id}` - Get station details
- `GET /api/stations/nearby?lat={lat}&lng={lng}` - Find nearby stations
- `GET /api/stations/{id}/availability` - Check real-time availability

### Bookings
- `POST /api/bookings` - Create new booking
- `GET /api/bookings` - Get user bookings
- `GET /api/bookings/{id}` - Get booking details
- `POST /api/bookings/{id}/scan-qr` - Scan QR code
- `POST /api/bookings/{id}/start` - Start charging session
- `PUT /api/bookings/{id}/progress` - Update SOC progress
- `POST /api/bookings/{id}/stop` - Stop charging session
- `DELETE /api/bookings/{id}` - Cancel booking

**Xem đầy đủ:** https://localhost:5001/swagger

---

## 💾 Database Schema

### 16 Tables:
- `users` - User accounts
- `user_profiles` - Extended user info
- `vehicles` - User vehicles
- `charging_stations` - Station locations
- `charging_posts` - AC/DC posts
- `charging_slots` - Individual charging slots
- `bookings` - Booking records
- `charging_sessions` - Active sessions
- `soc_tracking` - SOC history
- `soc_history` - Detailed SOC logs
- `invoices` - Payment records
- `qr_codes` - QR code data
- `notifications` - User notifications
- `reviews` - Station reviews
- `pricing_rules` - Dynamic pricing
- `system_logs` - Audit logs

### 15 Stored Procedures:
- `sp_authenticate_user` - Login authentication
- `sp_create_user` - User registration
- `sp_search_stations_by_location` - GPS search
- `sp_get_available_slots` - Slot availability
- `sp_create_booking` - Booking creation
- `sp_scan_qr_code` - QR validation
- `sp_start_charging` - Start session
- `sp_update_soc_progress` - SOC updates
- `sp_complete_charging` - Complete session
- `sp_cancel_booking` - Cancel booking
- `sp_get_user_booking_history` - User history
- `sp_get_booking_soc_history` - SOC history
- `sp_create_notification` - Push notification
- `sp_get_station_analytics` - Analytics
- `sp_get_system_health` - System status

**Xem schema:** `database/01_ANALYSIS.md`

---

## 🛠️ Tech Stack

### Frontend
- **React 19** - UI Framework
- **Vite 7** - Build tool & dev server
- **Zustand** - State management
- **Axios** - HTTP client
- **React Router** - Navigation
- **Tailwind CSS** - Styling (optional)

### Backend
- **ASP.NET Core 8** - Web API Framework
- **Entity Framework Core** - ORM
- **SQL Server** - Database
- **JWT Bearer** - Authentication
- **Serilog** - Logging
- **Swagger/OpenAPI** - API documentation

---

## 📖 Hướng Dẫn Chi Tiết

| Tài liệu | Mô tả |
|----------|-------|
| [QUICK_START.md](QUICK_START.md) | Chạy local trong 5 phút |
| [LOCAL_SETUP_GUIDE.md](LOCAL_SETUP_GUIDE.md) | Hướng dẫn setup đầy đủ |
| [API_DOCUMENTATION.md](SkaEV.API/API_DOCUMENTATION.md) | API endpoints & usage |
| [DATABASE_BACKEND_COMPATIBILITY.md](DATABASE_BACKEND_COMPATIBILITY.md) | Database schema & mapping |
| [MIGRATION_STATUS.md](MIGRATION_STATUS.md) | Frontend migration từ mock → real API |

---

## 🧪 Testing

### Frontend Testing
```powershell
npm run test          # Run unit tests
npm run test:e2e      # End-to-end tests
```

### Backend Testing
```powershell
cd SkaEV.API
dotnet test           # Run unit tests
```

### Manual Testing
1. Mở Swagger UI: https://localhost:5001/swagger
2. Test authentication: Register → Login → Get token
3. Authorize trong Swagger với token
4. Test các endpoints

---

## 🚢 Production Build

### Frontend
```powershell
npm run build         # Build to dist/
npm run preview       # Preview production build
```

### Backend
```powershell
cd SkaEV.API
dotnet publish -c Release -o ./publish
```

---

## 🐛 Troubleshooting

### Backend không start được
```powershell
# Kiểm tra SQL Server
Get-Service -Name "MSSQLSERVER" | Start-Service

# Kiểm tra connection string
# File: SkaEV.API/appsettings.json

# Xem logs
cat SkaEV.API/logs/skaev-*.txt
```

### Frontend không connect được backend
```powershell
# Đảm bảo backend đang chạy
curl http://localhost:5000/health

# Check CORS settings
# File: SkaEV.API/Program.cs → AddCors()

# Clear localStorage và login lại
# Console: localStorage.clear()
```

### Database lỗi
```sql
-- Verify database
USE SkaEV_DB;
SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES;  -- Phải có 16
SELECT COUNT(*) FROM INFORMATION_SCHEMA.ROUTINES WHERE ROUTINE_TYPE = 'PROCEDURE';  -- Phải có 15
```

**Xem đầy đủ:** `LOCAL_SETUP_GUIDE.md` → Section "Troubleshooting"

---

## 👥 Team

**SWP391_G4_Topic3 - FPT University**

- Backend Development
- Frontend Development  
- Database Design
- API Integration
- Testing & QA

---

## 📄 License

This project is licensed under the MIT License.

---

## 🙏 Acknowledgments

- FPT University - Software Project Management (SWP391)
- ASP.NET Core Documentation
- React Documentation
- SQL Server Documentation

---

## 📞 Support

Nếu gặp vấn đề:
1. Check [QUICK_START.md](QUICK_START.md)
2. Check [LOCAL_SETUP_GUIDE.md](LOCAL_SETUP_GUIDE.md) → "Troubleshooting"
3. Check backend logs: `SkaEV.API/logs/`
4. Check browser console: F12 → Console
5. Test API: https://localhost:5001/swagger

---

**✨ Happy Coding! 🚀**

**Last Updated:** October 13, 2025
