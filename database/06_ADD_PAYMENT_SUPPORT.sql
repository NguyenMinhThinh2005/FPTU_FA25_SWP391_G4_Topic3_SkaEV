-- =============================================
-- Script: 06_ADD_PAYMENT_SUPPORT.sql
-- Description: Add payment methods and enhance invoice tracking
-- Version: 1.0
-- Date: 2025-10-14
-- =============================================

USE SkaEV_DB;
GO

PRINT 'Adding payment support tables and columns...';

-- =============================================
-- 1. Create payment_methods table
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'payment_methods')
BEGIN
    CREATE TABLE payment_methods (
        payment_method_id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NOT NULL,
        type NVARCHAR(50) NOT NULL CHECK (type IN ('credit_card', 'debit_card', 'e_wallet', 'bank_transfer')),
        provider NVARCHAR(50), -- 'Visa', 'Mastercard', 'Momo', 'ZaloPay', 'VNPay'
        card_number_last4 NVARCHAR(4), -- Last 4 digits for security
        cardholder_name NVARCHAR(255),
        expiry_month INT CHECK (expiry_month BETWEEN 1 AND 12),
        expiry_year INT,
        is_default BIT DEFAULT 0,
        is_active BIT DEFAULT 1,
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE(),
        CONSTRAINT FK_PaymentMethods_Users FOREIGN KEY (user_id) 
            REFERENCES users(user_id) ON DELETE CASCADE
    );

    PRINT '✓ Created payment_methods table';
END
ELSE
BEGIN
    PRINT '- payment_methods table already exists';
END
GO

-- =============================================
-- 2. Add payment tracking columns to invoices
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.columns 
               WHERE object_id = OBJECT_ID('invoices') 
               AND name = 'payment_method')
BEGIN
    ALTER TABLE invoices 
    ADD payment_method NVARCHAR(50) DEFAULT 'online' 
        CHECK (payment_method IN ('online', 'cash', 'card_on_site', 'e_wallet'));
    
    PRINT '✓ Added payment_method column to invoices';
END
ELSE
BEGIN
    PRINT '- payment_method column already exists';
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns 
               WHERE object_id = OBJECT_ID('invoices') 
               AND name = 'payment_status')
BEGIN
    ALTER TABLE invoices 
    ADD payment_status NVARCHAR(50) DEFAULT 'pending' 
        CHECK (payment_status IN ('pending', 'processing', 'completed', 'failed', 'refunded'));
    
    PRINT '✓ Added payment_status column to invoices';
END
ELSE
BEGIN
    PRINT '- payment_status column already exists';
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns 
               WHERE object_id = OBJECT_ID('invoices') 
               AND name = 'paid_by_staff_id')
BEGIN
    ALTER TABLE invoices 
    ADD paid_by_staff_id INT NULL,
        CONSTRAINT FK_Invoices_Staff FOREIGN KEY (paid_by_staff_id) 
            REFERENCES users(user_id);
    
    PRINT '✓ Added paid_by_staff_id column to invoices';
END
ELSE
BEGIN
    PRINT '- paid_by_staff_id column already exists';
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns 
               WHERE object_id = OBJECT_ID('invoices') 
               AND name = 'payment_method_id')
BEGIN
    ALTER TABLE invoices 
    ADD payment_method_id INT NULL,
        CONSTRAINT FK_Invoices_PaymentMethods FOREIGN KEY (payment_method_id) 
            REFERENCES payment_methods(payment_method_id);
    
    PRINT '✓ Added payment_method_id column to invoices';
END
ELSE
BEGIN
    PRINT '- payment_method_id column already exists';
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns 
               WHERE object_id = OBJECT_ID('invoices') 
               AND name = 'paid_at')
BEGIN
    ALTER TABLE invoices 
    ADD paid_at DATETIME NULL;
    
    PRINT '✓ Added paid_at column to invoices';
END
ELSE
BEGIN
    PRINT '- paid_at column already exists';
END
GO

-- =============================================
-- 3. Create payments transaction log table
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'payments')
BEGIN
    CREATE TABLE payments (
        payment_id INT IDENTITY(1,1) PRIMARY KEY,
        invoice_id INT NOT NULL,
        payment_method_id INT NULL,
        amount DECIMAL(10,2) NOT NULL,
        payment_type NVARCHAR(50) NOT NULL CHECK (payment_type IN ('online', 'cash', 'card', 'e_wallet')),
        transaction_id NVARCHAR(255) NULL, -- External payment gateway transaction ID
        staff_id INT NULL, -- Staff who processed on-site payment
        status NVARCHAR(50) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
        payment_date DATETIME DEFAULT GETDATE(),
        refund_date DATETIME NULL,
        notes NVARCHAR(MAX) NULL,
        created_at DATETIME DEFAULT GETDATE(),
        CONSTRAINT FK_Payments_Invoices FOREIGN KEY (invoice_id) 
            REFERENCES invoices(invoice_id) ON DELETE CASCADE,
        CONSTRAINT FK_Payments_PaymentMethods FOREIGN KEY (payment_method_id) 
            REFERENCES payment_methods(payment_method_id),
        CONSTRAINT FK_Payments_Staff FOREIGN KEY (staff_id) 
            REFERENCES users(user_id)
    );

    -- Index for faster lookups
    CREATE INDEX IX_Payments_Invoice ON payments(invoice_id);
    CREATE INDEX IX_Payments_TransactionId ON payments(transaction_id);
    CREATE INDEX IX_Payments_Status ON payments(status);

    PRINT '✓ Created payments table';
END
ELSE
BEGIN
    PRINT '- payments table already exists';
END
GO

-- =============================================
-- 4. Create indexes for better performance
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.indexes 
               WHERE name = 'IX_PaymentMethods_UserId' 
               AND object_id = OBJECT_ID('payment_methods'))
BEGIN
    CREATE INDEX IX_PaymentMethods_UserId ON payment_methods(user_id);
    PRINT '✓ Created index IX_PaymentMethods_UserId';
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes 
               WHERE name = 'IX_PaymentMethods_Default' 
               AND object_id = OBJECT_ID('payment_methods'))
BEGIN
    CREATE INDEX IX_PaymentMethods_Default ON payment_methods(user_id, is_default) WHERE is_default = 1;
    PRINT '✓ Created index IX_PaymentMethods_Default';
END
GO

-- =============================================
-- 5. Insert sample payment methods (optional)
-- =============================================
-- Add default payment methods for existing test user
IF EXISTS (SELECT 1 FROM users WHERE email = 'admin@skaev.com')
BEGIN
    DECLARE @AdminUserId INT = (SELECT user_id FROM users WHERE email = 'admin@skaev.com');
    
    IF NOT EXISTS (SELECT 1 FROM payment_methods WHERE user_id = @AdminUserId)
    BEGIN
        INSERT INTO payment_methods (user_id, type, provider, card_number_last4, cardholder_name, expiry_month, expiry_year, is_default, is_active)
        VALUES 
            (@AdminUserId, 'credit_card', 'Visa', '4242', 'ADMIN USER', 12, 2026, 1, 1),
            (@AdminUserId, 'e_wallet', 'Momo', NULL, NULL, NULL, NULL, 0, 1);
        
        PRINT '✓ Inserted sample payment methods for admin user';
    END
END
GO

-- =============================================
-- 6. Update existing invoices
-- =============================================
UPDATE invoices 
SET payment_method = 'online',
    payment_status = 'completed',
    paid_at = created_at
WHERE payment_status IS NULL;

PRINT '✓ Updated existing invoices with default payment status';
GO

PRINT '========================================';
PRINT 'Payment Support Migration Completed!';
PRINT '========================================';
PRINT 'Tables created:';
PRINT '  - payment_methods';
PRINT '  - payments';
PRINT 'Columns added to invoices:';
PRINT '  - payment_method';
PRINT '  - payment_status';
PRINT '  - paid_by_staff_id';
PRINT '  - payment_method_id';
PRINT '  - paid_at';
PRINT '========================================';
GO
