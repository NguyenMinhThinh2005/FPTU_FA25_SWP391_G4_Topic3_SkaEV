-- Minimal schema and sample data for revenue-by-connector testing
-- WARNING: This is a tiny subset of the real schema. Use only for local testing.
SET NOCOUNT ON;

IF DB_ID('SkaEV_DB') IS NULL
BEGIN
    PRINT 'Creating SkaEV_DB';
    CREATE DATABASE SkaEV_DB;
END
GO

USE SkaEV_DB;
GO

-- Charging stations
IF OBJECT_ID('dbo.charging_stations') IS NULL
BEGIN
CREATE TABLE dbo.charging_stations (
    station_id INT IDENTITY(1,1) PRIMARY KEY,
    station_name NVARCHAR(255) NOT NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE()
);
END
GO

-- Charging slots
IF OBJECT_ID('dbo.charging_slots') IS NULL
BEGIN
CREATE TABLE dbo.charging_slots (
    slot_id INT IDENTITY(1,1) PRIMARY KEY,
    slot_number NVARCHAR(50) NOT NULL,
    connector_type NVARCHAR(50) NOT NULL,
    post_id INT NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE()
);
END
GO

-- Bookings
IF OBJECT_ID('dbo.bookings') IS NULL
BEGIN
CREATE TABLE dbo.bookings (
    booking_id INT IDENTITY(1,1) PRIMARY KEY,
    slot_id INT NOT NULL,
    station_id INT NOT NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE()
);
END
GO

-- Invoices
IF OBJECT_ID('dbo.invoices') IS NULL
BEGIN
CREATE TABLE dbo.invoices (
    invoice_id INT IDENTITY(1,1) PRIMARY KEY,
    booking_id INT NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    total_energy_kwh DECIMAL(10,2) NOT NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    paid_at DATETIME2 NULL
);
END
GO

-- Foreign keys (light constraints)
IF OBJECT_ID('FK_Booking_Slot','F') IS NULL
BEGIN
ALTER TABLE dbo.bookings
ADD CONSTRAINT FK_Booking_Slot FOREIGN KEY (slot_id) REFERENCES dbo.charging_slots(slot_id);
END
GO

IF OBJECT_ID('FK_Invoice_Booking','F') IS NULL
BEGIN
ALTER TABLE dbo.invoices
ADD CONSTRAINT FK_Invoice_Booking FOREIGN KEY (booking_id) REFERENCES dbo.bookings(booking_id);
END
GO

-- Sample data
PRINT 'Inserting sample data...';

-- Stations
INSERT INTO dbo.charging_stations (station_name) VALUES ('Central Station');
INSERT INTO dbo.charging_stations (station_name) VALUES ('North Station');

-- Slots (connector types: CCS, CHAdeMO)
INSERT INTO dbo.charging_slots (slot_number, connector_type) VALUES ('S1', 'CCS');
INSERT INTO dbo.charging_slots (slot_number, connector_type) VALUES ('S2', 'CHAdeMO');
INSERT INTO dbo.charging_slots (slot_number, connector_type) VALUES ('S3', 'CCS');

-- Bookings (associate slots with station 1)
INSERT INTO dbo.bookings (slot_id, station_id, created_at) VALUES (1, 1, DATEADD(day, -2, GETDATE()));
INSERT INTO dbo.bookings (slot_id, station_id, created_at) VALUES (2, 1, DATEADD(day, -1, GETDATE()));
INSERT INTO dbo.bookings (slot_id, station_id, created_at) VALUES (3, 1, DATEADD(day, -3, GETDATE()));

-- Invoices (paid)
INSERT INTO dbo.invoices (booking_id, total_amount, total_energy_kwh, created_at, paid_at) VALUES (1, 50.00, 20.00, DATEADD(day, -2, GETDATE()), DATEADD(day, -2, GETDATE()));
INSERT INTO dbo.invoices (booking_id, total_amount, total_energy_kwh, created_at, paid_at) VALUES (2, 30.00, 12.00, DATEADD(day, -1, GETDATE()), DATEADD(day, -1, GETDATE()));
INSERT INTO dbo.invoices (booking_id, total_amount, total_energy_kwh, created_at, paid_at) VALUES (3, 40.00, 15.00, DATEADD(day, -3, GETDATE()), DATEADD(day, -3, GETDATE()));

PRINT 'Seed complete.';
GO
