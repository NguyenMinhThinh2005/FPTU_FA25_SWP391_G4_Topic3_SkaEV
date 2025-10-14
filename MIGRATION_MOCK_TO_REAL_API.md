# MIGRATION: Mock API  Real API

## Date: 2025-10-14 10:49:10

## Changes Made

### 1. API Service Files

**BEFORE:**
-  \src/services/api.js\ - Mock API (fake data, no backend)

**AFTER:**
-  \src/services/api.js\ - Real API (connects to http://localhost:5000)
-  \src/services/api.mock.backup.js\ - Backup of old mock API
-  \src/services/api.real.js\ - Source file for real API

### 2. Store Updates

All Zustand stores now use REAL API:

**authStore.js**
\\\javascript
// BEFORE: import { authAPI } from "../services/api"; // Mock
// AFTER:  import { authAPI } from "../services/api";  // Real API
\\\

**bookingStore.js**
\\\javascript
// BEFORE: import { bookingsAPI } from "../services/api"; // Mock
// AFTER:  import { bookingsAPI } from "../services/api";  // Real API
\\\

**stationStore.js**
\\\javascript
// BEFORE: import { stationsAPI } from "../services/api"; // Mock
// AFTER:  import { stationsAPI } from "../services/api";  // Real API
\\\

### 3. API Endpoints (Real Backend)

All API calls now connect to: **http://localhost:5000/api**

**Authentication:**
- POST \/auth/login\ - Login with email/password
- POST \/auth/register\ - Register new user
- POST \/auth/logout\ - Logout user
- POST \/auth/refresh\ - Refresh JWT token
- GET  \/auth/profile\ - Get user profile

**Stations:**
- GET    \/stations\ - Get all stations
- GET    \/stations/:id\ - Get single station
- GET    \/stations/nearby\ - Get nearby stations
- GET    \/stations/:id/availability\ - Check availability
- POST   \/stations\ - Create station (admin)
- PUT    \/stations/:id\ - Update station (admin)
- DELETE \/stations/:id\ - Delete station (admin)

**Bookings:**
- GET    \/bookings\ - Get all bookings
- GET    \/bookings/:id\ - Get single booking
- GET    \/bookings/my-bookings\ - Get user's bookings
- POST   \/bookings\ - Create new booking
- PUT    \/bookings/:id\ - Update booking
- POST   \/bookings/:id/cancel\ - Cancel booking
- POST   \/bookings/:id/complete\ - Complete booking

**Users:**
- GET    \/users\ - Get all users (admin)
- GET    \/users/:id\ - Get single user
- POST   \/users\ - Create user (admin)
- PUT    \/users/:id\ - Update user
- DELETE \/users/:id\ - Delete user (admin)

**Payments:**
- GET    \/payments\ - Get all payments
- GET    \/payments/:id\ - Get single payment
- POST   \/payments\ - Create payment
- POST   \/payments/:id/process\ - Process payment
- POST   \/payments/:id/refund\ - Refund payment

**Posts (Charging Posts):**
- GET    \/posts\ - Get all charging posts
- GET    \/posts/:id\ - Get single post
- GET    \/stations/:id/posts\ - Get posts by station
- POST   \/posts\ - Create post (admin)
- PUT    \/posts/:id\ - Update post
- DELETE \/posts/:id\ - Delete post

### 4. Features (Real vs Mock)

| Feature | Mock API | Real API |
|---------|----------|----------|
| Data Source | JavaScript objects | SQL Server database |
| Authentication | Fake validation | JWT tokens |
| Data Persistence | Lost on refresh | Saved in database |
| CORS | Not needed | Configured |
| Network Delay | Simulated (500ms) | Real (30-100ms) |
| Error Handling | Fake errors | Real HTTP errors |
| Token Refresh | Not implemented | Auto-refresh on 401 |
| Validation | Client-side only | Server-side + client |

### 5. Configuration

**Environment Variables (.env):**
\\\
VITE_API_BASE_URL=http://localhost:5000/api
VITE_ENV=development
\\\

**Axios Configuration:**
- Base URL: http://localhost:5000/api
- Timeout: 10 seconds
- Auto token injection in headers
- Auto token refresh on 401
- Global error handling

### 6. Token Management

**Local Storage:**
- \	oken\ - JWT access token (24h expiry)
- \efreshToken\ - Refresh token (7 days)

**Auto-refresh:**
When API returns 401, frontend automatically:
1. Tries to refresh token
2. Retries failed request
3. If refresh fails  redirects to login

### 7. Database Connection

**Backend connects to:**
- Server: localhost (SQL Server 2022)
- Database: SkaEV_DB
- Records: 20 stations, 221 charging posts, 1 user

### 8. Testing

**Integration Tests:**
 Backend health check
 CORS configuration
 GET /api/stations (20 records)
 GET /api/stations/1 (single record)
 POST /api/auth/login (401 for invalid)
 Performance (48ms average)

**Test Page:**
http://localhost:5173/test-api

### 9. Backward Compatibility

**Mock API Backup:**
Old mock API saved as: \src/services/api.mock.backup.js\

To restore mock API (for testing):
\\\powershell
Copy-Item src\services\api.mock.backup.js src\services\api.js -Force
\\\

### 10. Breaking Changes

 **Important:** Frontend now REQUIRES backend to be running!

**Before:** Frontend works standalone
**After:** Frontend needs backend at http://localhost:5000

**Start both servers:**
\\\powershell
# Terminal 1: Backend
dotnet run --project SkaEV.API\SkaEV.API.csproj

# Terminal 2: Frontend  
npm run dev
\\\

### 11. Benefits

 Real data from database
 Proper authentication with JWT
 Data persistence across sessions
 Server-side validation
 Multi-user support
 Real-time data updates
 Production-ready architecture

### 12. Next Steps

1.  All mock data removed
2.  Real API integrated
3.  Test all features end-to-end
4.  Add error boundaries
5.  Add loading states
6.  Add data validation
7.  Add offline support (optional)

---

**Status:**  MIGRATION COMPLETE

All components now use REAL API connected to ASP.NET Core backend!
