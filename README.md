# SkaEV - EV Charging Station Management System

SkaEV is a comprehensive platform designed to streamline the management and usage of electric vehicle (EV) charging stations. It provides a seamless experience for EV owners to find, book, and pay for charging, while giving station operators powerful tools to manage their infrastructure.

## 🚀 Key Features

### For EV Drivers
- **Smart Booking**: Schedule charging sessions in advance or book instantly via QR code.
- **Real-time Navigation**: Locate nearby charging stations with integrated maps and route planning.
- **Seamless Payments**: Secure payment processing with VNPay and automated invoicing.
- **Vehicle Management**: Track multiple vehicles, monitor charging status, and view history.
- **Live Updates**: Receive real-time notifications for booking confirmations and charging progress via SignalR.

### For Station Operators
- **Station Dashboard**: Monitor station health, slot availability, and energy consumption in real-time.
- **Incident Management**: Track maintenance issues and assign tasks to staff.
- **Analytics**: Gain insights into revenue, usage trends, and customer behavior.
- **User Management**: CRM capabilities to support customers and manage memberships.

## 🛠️ Technology Stack

### Backend
- **Framework**: ASP.NET Core 8 Web API
- **Database**: SQL Server with Entity Framework Core
- **Authentication**: JWT (JSON Web Tokens)
- **Real-time**: SignalR for live data updates
- **Testing**: xUnit

### Frontend
- **Framework**: React (Vite)
- **State Management**: Zustand
- **UI Architecture**: TailwindCSS (Modern/Glassmorphism Design)
- **HTTP Client**: Axios
- **Maps**: Google Maps API / OSRM

## 📦 Getting Started

### Prerequisites
- .NET 8 SDK
- Node.js (v18+)
- SQL Server

### Installation Guide

1. **Clone the Repository**
   ```bash
   git clone https://github.com/NguyenMinhThinh2005/FPTU_FA25_SWP391_G4_Topic3_SkaEV.git
   cd FPTU_FA25_SWP391_G4_Topic3_SkaEV
   ```

2. **Backend Setup**
   - Navigate to the API directory: `cd SkaEV.API`
   - Configure your database connection in `appsettings.json`.
   - Apply database migrations:
     ```bash
     dotnet ef database update
     ```
   - Run the API server:
     ```bash
     dotnet run
     ```

3. **Frontend Setup**
   - Navigate to the source directory: `cd src` (or the root if package.json is there)
   - Install dependencies:
     ```bash
     npm install
     ```
   - Start the development server:
     ```bash
     npm run dev
     ```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
